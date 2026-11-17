import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { toast } from "sonner";
import { apiRequest, notifyLogout, GENERIC_SERVER_ERROR } from "@/services/api";
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

  it.each(["9998", "9997"])("dispatches app:session-invalid with the code and returns null on code %s", async (code) => {
    const body = { group: { getOut: { notification: { msg: [{ code, msgBody: "server text" }] } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    const listener = vi.fn();
    window.addEventListener("app:session-invalid", listener);
    expect(await apiRequest("/E", {})).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ code });
    window.removeEventListener("app:session-invalid", listener);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows the server message as a normal error toast on code 9996 and does not log out", async () => {
    const body = { group: { getOut: { notification: { msg: [{ code: 9996, msgBody: "תקלה כללית בחיבור. אנא פנה לתמיכה" }] } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    const listener = vi.fn();
    window.addEventListener("app:session-invalid", listener);
    expect(await apiRequest("/E", {})).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener("app:session-invalid", listener);
    expect(toast.error).toHaveBeenCalledWith("תקלה כללית בחיבור. אנא פנה לתמיכה");
  });

  it.each([
    "Connection to 10.10.14.52:8182 failed",
    "http://internal-host:8085/Services/NPG failed",
    "XML Validation Error: schema xmlns:ns0 mismatch",
    "SOAP fault at /EAI/Services/NPG/general",
    "ORA-00942: table or view does not exist",
  ])("shows a generic message instead of the technical server message: %s", async (technical) => {
    const body = { group: { getOut: { notification: { msg: [{ code: 2001, msgBody: technical }] } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await apiRequest("/E", {});
    expect(toast.error).toHaveBeenCalledWith(GENERIC_SERVER_ERROR);
  });

  it("keeps ordinary Hebrew business messages unchanged", async () => {
    const body = { group: { getOut: { notification: { msg: [{ code: 2001, msgBody: "מזהה בקשה חייב להתחיל ב-NP (12/05/2026)" }] } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    await apiRequest("/E", {});
    expect(toast.error).toHaveBeenCalledWith("מזהה בקשה חייב להתחיל ב-NP (12/05/2026)");
  });

  it("also cleans technical messages that components display themselves (code 1000 with an extra message)", async () => {
    const body = { group: { getOut: { notification: { msg: [{ code: 1000, msgBody: "ok" }, { code: 2002, msgBody: { $: "failed at 10.1.2.3" } }] }, data: { xml: "<a>kept</a>" } } } };
    vi.stubGlobal("fetch", mockFetch(JSON.stringify(body)));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res: any = await apiRequest("/E", {});
    expect(res.getOut.notification.msg[1].msgBody.$).toBe(GENERIC_SERVER_ERROR);
    expect(res.getOut.notification.msg[0].msgBody).toBe("ok");
    expect(res.getOut.data.xml).toBe("<a>kept</a>"); // data fields are not touched
  });

  it("notifyLogout posts the token with keepalive and never throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    expect(() => notifyLogout("NP123W", "320")).not.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/Logout");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body)).toEqual({ getIn: { token: "NP123W", selfNetworkID: "320" } });
    notifyLogout("", "320"); // no token: nothing is sent
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
