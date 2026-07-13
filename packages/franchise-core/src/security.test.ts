import { describe, expect, it } from "vitest";
import { isStale, sign, verify, withTimeout } from "./security";

describe("hmac", () => {
  it("round-trips and rejects tampering / wrong secret / bad sig format", async () => {
    const sig = await sign("s3cret", "payload");
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
    expect(await verify("s3cret", "payload", sig)).toBe(true);
    expect(await verify("s3cret", "payload2", sig)).toBe(false);
    expect(await verify("other", "payload", sig)).toBe(false);
    expect(await verify("s3cret", "payload", "zz")).toBe(false);
  });
});

describe("replay window", () => {
  const now = Date.parse("2026-07-13T12:00:00Z");
  it("accepts fresh, rejects old/future/garbage timestamps", () => {
    expect(isStale("2026-07-13T11:55:00Z", now)).toBe(false);
    expect(isStale("2026-07-13T11:40:00Z", now)).toBe(true);
    expect(isStale("2026-07-13T12:20:00Z", now)).toBe(true);
    expect(isStale("not-a-date", now)).toBe(true);
  });
});

describe("withTimeout", () => {
  it("returns results and aborts slow ops", async () => {
    expect(await withTimeout(async () => 42, 1000)).toBe(42);
    await expect(
      withTimeout((signal) => new Promise((_, rej) => signal.addEventListener("abort", () => rej(signal.reason))), 20),
    ).rejects.toThrow("timeout");
  });
});
