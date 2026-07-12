import { describe, it, expect } from "vitest";
import { predictPickup, driverPayout, lifetimeSavings, savingsFor } from "./index";

describe("predictPickup", () => {
  it("returns the most common weekday and its typical bag count", () => {
    const p = predictPickup([
      { weekday: 2, bags: 3 },
      { weekday: 2, bags: 3 },
      { weekday: 2, bags: 4 },
      { weekday: 5, bags: 2 },
    ]);
    expect(p?.weekday).toBe(2);
    expect(p?.typicalBags).toBe(3);
    expect(p?.confidence).toBeGreaterThan(0.5);
  });
  it("returns null with no history", () => {
    expect(predictPickup([])).toBeNull();
  });
});

describe("driverPayout", () => {
  it("sums base + per-stop + tips", () => {
    const p = driverPayout(8, 20);
    expect(p.perStopPay).toBe(28); // 8 × 3.5
    expect(p.total).toBe(66); // 18 + 28 + 20
  });
});

describe("lifetimeSavings", () => {
  it("aggregates savings across orders", () => {
    const total = lifetimeSavings([3, 3]);
    const one = savingsFor(3);
    expect(total.gallons).toBe(one.gallons * 2);
    expect(total.value).toBeCloseTo(one.value.total * 2, 2);
  });
});
