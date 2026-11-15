#!/usr/bin/env node
// Read-only check: does the TIBCO back end reject requests whose token was not issued by a real login?
// Context: pen-test finding 2.2 (login bypass by editing the GetLogin response in a proxy).
//
// Usage:
//   node scripts/token-check.mjs                                  # via Apache over HTTP
//   node scripts/token-check.mjs --base=https://10.10.14.52/api --insecure
//   node scripts/token-check.mjs --base=http://10.10.14.52:8085   # straight to the TIBCO listener
// Options: --network=320  (selfNetworkID)
// Credentials come from .env.test (E2E_USER / E2E_PASSWORD) and are never printed.
// Only Get* services are called. Nothing is saved, added or deleted.

import { existsSync } from "node:fs";

if (existsSync(".env.test")) process.loadEnvFile(".env.test");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const BASE = String(args.base || "http://10.10.14.52/api").replace(/\/$/, "");
const NETWORK = String(args.network || "320");
if (args.insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // self-signed test certificate only

const { E2E_USER, E2E_PASSWORD } = process.env;
if (!E2E_USER || !E2E_PASSWORD) {
  console.error("Missing E2E_USER / E2E_PASSWORD (.env.test)");
  process.exit(2);
}

// Same sanitising + envelope unwrapping as src/services/api.ts
async function call(endpoint, getIn) {
  let res, text;
  try {
    res = await fetch(`${BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ getIn }),
      signal: AbortSignal.timeout(20000),
    });
    text = await res.text();
  } catch (e) {
    return { http: "ERR", code: "-", msg: String(e.cause?.code || e.message), size: 0, hasData: false };
  }
  const fixed = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\\'/g, "'");
  let json;
  try {
    json = JSON.parse(fixed);
  } catch {
    return { http: res.status, code: "-", msg: "non-JSON response", size: text.length, hasData: false };
  }
  const wrapped = json.group || json.root || json;
  const nested = wrapped.LoginResponse || wrapped.getOut || wrapped;
  const notif = nested.notification?.msg || nested;
  const code = String(Array.isArray(notif) ? notif[0]?.code : (notif?.Code ?? notif?.code) ?? "");
  const msg = String(Array.isArray(notif) ? notif[0]?.msgBody : (notif?.msg ?? notif?.msgBody) ?? "");
  const hasData = !!wrapped.getOut || !!wrapped.data;
  return { http: res.status, code: code || "(none)", msg: msg.slice(0, 60), size: text.length, hasData, wrapped, json };
}

// "accepted" = the app itself would treat the answer as success (code 1000 or no code at all)
const accepted = (r) => r.http === 200 && (r.code === "1000" || r.code === "(none)");

// ---- 1. real login ----
const loginTs = `NP_${Date.now()}`;
const login = await call("/GetLogin", {
  user: E2E_USER,
  password: E2E_PASSWORD,
  token: loginTs,
  selfNetworkID: NETWORK,
});
const lr = login.wrapped?.LoginResponse || login.wrapped || {};
if (login.code !== "1000") {
  console.error(`Login failed: HTTP ${login.http}, code ${login.code}, ${login.msg}`);
  process.exit(2);
}
const realToken = lr.token || null;
const roleID = lr.roleID || lr.roleId || (globalThis.process.env.E2E_ROLE ?? "NPG_ADMINISTRATOR");
console.log(`Login OK (HTTP ${login.http}). Server issued its own token: ${realToken ? "yes" : "NO (app falls back to the client-made one)"}`);
console.log(`Base: ${BASE}   network: ${NETWORK}\n`);

const validToken = realToken || loginTs;

// ---- 2. read-only services ----
const SERVICES = [
  ["/GetCalendar", {}],
  ["/GetNPGSystemState", {}],
  ["/GetConfigValues", {}],
  ["/GetOperatorRegistry", { BusinessId: "" }],
  ["/GetInterfaces", { operatorID: "ALL" }],
  ["/GetSummaryActivities", { refreshTime: 60 }],
];

// ---- 3. token variants (A must be accepted, the rest must be rejected) ----
const CASES = [
  { id: "A", label: "real token (baseline)", token: validToken, expect: "accept" },
  { id: "B", label: "made-up NP_<ts>", token: `NP_${Date.now() - 12345}`, expect: "reject" },
  { id: "C", label: "empty token", token: "", expect: "reject" },
  { id: "D", label: "no token field", token: undefined, expect: "reject" },
  { id: "E", label: "NPDUMMY_<ts> (no-login mode)", token: `NPDUMMY_${Date.now()}`, expect: "reject" },
  { id: "F", label: "real token, mangled", token: validToken.slice(0, -1) + (validToken.endsWith("x") ? "y" : "x"), expect: "reject" },
];

const rows = [];
for (const [ep, extra] of SERVICES) {
  let baselineOk = true;
  for (const c of CASES) {
    const getIn = { selfNetworkID: NETWORK, roleID, ...extra };
    if (c.token !== undefined) getIn.token = c.token;
    const r = await call(ep, getIn);
    let verdict;
    if (c.expect === "accept") {
      baselineOk = accepted(r) && r.hasData;
      verdict = baselineOk ? "BASELINE OK" : "BASELINE FAILED (inconclusive)";
    } else if (!baselineOk) {
      verdict = "inconclusive";
    } else {
      verdict = accepted(r) ? "FAIL - served without valid token" : "pass";
    }
    rows.push({ service: ep.slice(1), case: `${c.id} ${c.label}`, http: r.http, code: r.code, bytes: r.size, verdict, msg: r.msg });
  }
}

console.table(rows);
const fails = rows.filter((r) => r.verdict.startsWith("FAIL"));
const inc = rows.filter((r) => r.verdict.includes("inconclusive"));
console.log(
  fails.length
    ? `\nRESULT: ${fails.length} request(s) were served without a valid token -> report these services to the TIBCO team:\n  ${[...new Set(fails.map((f) => f.service))].join(", ")}`
    : inc.length
      ? "\nRESULT: no failures, but some services had no usable baseline (payload needs adjusting) - not proven safe."
      : "\nRESULT: every invalid token was rejected. Finding 2.2 affects only the UI shell, not the data services.",
);
console.log("Not covered: token expiry/logout (step D in the plan) and the Set* services - test those by hand.");
process.exit(fails.length ? 1 : 0);
