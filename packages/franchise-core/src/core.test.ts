import { describe, expect, it } from "vitest";
import { MemoryStore, isValidKey, once } from "./idempotency";
import { canTransition, isCancelable } from "./state";
import { CORONADO_BBOX, geoConfig, inServiceArea } from "./geo";

describe("idempotency", () => {
  it("runs op once per key and replays the saved response", async () => {
    const store = new MemoryStore();
    let calls = 0;
    const op = async () => ({ id: ++calls });
    expect(await once(store, "key_12345678", "submit-order", op)).toEqual({ id: 1 });
    expect(await once(store, "key_12345678", "submit-order", op)).toEqual({ id: 1 });
    expect(calls).toBe(1);
  });
  it("rejects malformed keys and dedupes events", async () => {
    expect(isValidKey("short")).toBe(false);
    expect(isValidKey("has spaces!")).toBe(false);
    await expect(once(new MemoryStore(), "bad key", "s", async () => 1)).rejects.toThrow();
    const store = new MemoryStore();
    expect(await store.markEvent("evt_1", "order.accepted", "2026-07-13T12:00:00Z")).toBe(false);
    expect(await store.markEvent("evt_1", "order.accepted", "2026-07-13T12:00:00Z")).toBe(true);
  });
});

describe("state machine", () => {
  it("allows the happy path and blocks illegal jumps", () => {
    expect(canTransition("draft", "reserved")).toBe(true);
    expect(canTransition("delivered", "settled")).toBe(true);
    expect(canTransition("draft", "delivered")).toBe(false);
    expect(canTransition("settled", "draft")).toBe(false);
  });
  it("cancel only before pickup", () => {
    expect(isCancelable("reserved")).toBe(true);
    expect(isCancelable("picked_up")).toBe(false);
  });
});

describe("geo", () => {
  it("resolves env-configurable paths and bounds the service area", () => {
    expect(geoConfig().mmdbPath).toBe("/var/apps/GeoLite2-City.mmdb");
    expect(geoConfig({ GEOIP_MMDB_PATH: "/x.mmdb" }).mmdbPath).toBe("/x.mmdb");
    expect(inServiceArea(32.6859, -117.1831)).toBe(true);   // Orange Ave
    expect(inServiceArea(32.7157, -117.1611)).toBe(false);  // downtown SD
    expect(inServiceArea(NaN, 0)).toBe(false);
    expect(CORONADO_BBOX.minLat).toBeLessThan(CORONADO_BBOX.maxLat);
  });
});
