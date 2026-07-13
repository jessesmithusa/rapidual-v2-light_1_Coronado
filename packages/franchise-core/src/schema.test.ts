import { describe, expect, it } from "vitest";
import { parseBoundedJson, submitReservationSchema, validate } from "./schema";

const good = {
  external_ref: "01J0ABCDEF",
  pickup_window_start: "2026-07-14T16:00:00Z",
  pickup_window_end: "2026-07-14T18:00:00Z",
  bag_count: 3,
  address: "1100 Orange Ave, Coronado, CA",
};

describe("validate", () => {
  it("accepts a valid submission", () => {
    expect(validate(good, submitReservationSchema).ok).toBe(true);
  });
  it("rejects unknown fields", () => {
    const r = validate({ ...good, evil: 1 }, submitReservationSchema);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("unknown field");
  });
  it("rejects __proto__ and missing/oversized/out-of-range values", () => {
    expect(validate(JSON.parse('{"__proto__": {}}'), submitReservationSchema).ok).toBe(false);
    expect(validate({ ...good, bag_count: 21 }, submitReservationSchema).ok).toBe(false);
    expect(validate({ ...good, notes: "x".repeat(501) }, submitReservationSchema).ok).toBe(false);
    expect(validate({ ...good, payment_method: "crypto" }, submitReservationSchema).ok).toBe(false);
    const { address, ...missing } = good;
    expect(validate(missing, submitReservationSchema).ok).toBe(false);
  });
  it("rejects non-objects", () => {
    expect(validate([1], submitReservationSchema).ok).toBe(false);
    expect(validate("hi", submitReservationSchema).ok).toBe(false);
  });
});

describe("parseBoundedJson", () => {
  it("bounds payload size and rejects bad JSON", () => {
    expect(parseBoundedJson('{"a":1}', 100).ok).toBe(true);
    expect(parseBoundedJson("x".repeat(200), 100).ok).toBe(false);
    expect(parseBoundedJson("{nope", 100).ok).toBe(false);
  });
});
