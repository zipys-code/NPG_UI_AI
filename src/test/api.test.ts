import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";
import { apiRequest } from "@/services/api";
import { formatForTibco } from "@/lib/utils";

const mockFetch = (body: string, ok = true) =>
  vi.fn().mockResolvedValue({ ok, text: () => Promise.resolve(body) });

describe("apiRequest", () => {
  beforeEach(() => {
    (window as any).APP_CONFIG = { BASE_URL: "/api" };
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(toast.error).mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("POSTs JSON to BASE_URL + endpoint", async () => {
    const f = mockFetch(JSON.stringify({ group: { ok: 1 } }));
    vi.stubGlobal("fetch", f);
    await apiRequest("/GetX", { a: 1 });
    expect(f).toHaveBeenCalledWith("/api/GetX", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    }));
  });

  it("returns the group envelope when there is no notification", async () => {
    vi.stubGlobal("fetch", mockFetch(JSON.stringify({ group: { getOut: { x: 1 } } })));
    expect(await apiRequest("/E", {})).toEqual({ getOut: { x: 1 } });
  });

  it("falls back to root, then to the raw result", async () => {
    vi.stubGlobal("fetch", mockFetch(JSON.stringify({ root: { v: 1 } })));
    expect(await apiRequest("/E", {})).toEqual({ v: 1 });
    vi.stubGlobal("fetch", mockFetch(JSON.stringify({ v: 2 })));
    expect(await apiRequest("/E", {})).toEqual({ v: 2 });
  });

  it("returns data on success code 1000 (array notification)", async () => {
    const body = { group: { getOut: { notification: { msg: [{ code: 1000, msgBody: "ok" }] }, d: 1 } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    expect(await apiRequest("/E", {})).toEqual(body.group);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("accepts capitalised Code on an object notification", async () => {
    const body = { group: { LoginResponse: { notification: { msg: { Code: "1000" } } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    expect(await apiRequest("/Login", {})).toEqual(body.group);
  });

  it("toasts the message and returns null on an error code", async () => {
    const body = { group: { getOut: { notification: { msg: [{ code: 2001, msgBody: "מספר לא קיים" }] } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    expect(await apiRequest("/E", {})).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("מספר לא קיים");
  });

  it("uses a default message when the error has no body", async () => {
    const body = { group: { getOut: { notification: { msg: [{ code: 2001 }] } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    await apiRequest("/E", {});
    expect(toast.error).toHaveBeenCalledWith("שגיאה בפעולה");
  });

  it("dispatches app:config-changed and returns null on code 9999", async () => {
    const body = { group: { getOut: { notification: { msg: [{ code: 9999 }] } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    const listener = vi.fn();
    window.addEventListener("app:config-changed", listener);
    expect(await apiRequest("/E", {})).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("app:config-changed", listener);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("strips control characters before parsing", async () => {
    vi.stubGlobal("fetch", mockFetch('{"group":{"a":"x\u0001y"}}'));
    expect(await apiRequest("/E", {})).toEqual({ a: "xy" });
  });

  it("unescapes backslash-apostrophe sequences", async () => {
    vi.stubGlobal("fetch", mockFetch(String.raw`{"group":{"a":"it\'s"}}`));
    expect(await apiRequest("/E", {})).toEqual({ a: "it's" });
  });

  it("returns null on invalid JSON", async () => {
    vi.stubGlobal("fetch", mockFetch("<html>502</html>"));
    expect(await apiRequest("/E", {})).toBeNull();
  });

  it("returns null on HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch("{}", false));
    expect(await apiRequest("/E", {})).toBeNull();
  });

  it("returns null when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await apiRequest("/E", {})).toBeNull();
  });
});

describe("formatForTibco", () => {
  it("converts ISO date-time to dd/MM/yyyy and time", () => {
    expect(formatForTibco("2026-03-07T14:30")).toEqual({ date: "07/03/2026", time: "14:30" });
  });
  it("defaults the time to 00:00", () => {
    expect(formatForTibco("2026-03-07")).toEqual({ date: "07/03/2026", time: "00:00" });
  });
  it("returns empty strings for empty input", () => {
    expect(formatForTibco("")).toEqual({ date: "", time: "" });
  });
});
