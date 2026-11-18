import { describe, it, expect } from "vitest";
import { getAppBaseUrl } from "@/lib/utils";

describe("getAppBaseUrl", () => {
  it("returns an absolute path (dev base './' is mapped to '/')", () => {
    const url = getAppBaseUrl();
    expect(url.startsWith("/")).toBe(true);
    expect(url).not.toBe("./");
  });
});
