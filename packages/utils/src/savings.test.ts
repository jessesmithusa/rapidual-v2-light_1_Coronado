import { describe, it, expect } from "vitest";
import {
  savingsFor, orderValue, SAVINGS_PER_BAG, SAVINGS_BASE, VALUE_RATES,
  REAL_PRICE_FLOOR, CAP_REAL_PRICE, GRID_LB_CO2_PER_KWH,
} from "./index";

const r2 = (n: number) => Math.round(n * 100) / 100;

describe("savingsFor (derived from cited constants)", () => {
  it("scales linearly with bags", () => {
    const s = savingsFor(3);
    expect(s.gallons).toBe(SAVINGS_BASE.gallons + SAVINGS_PER_BAG.gallons * 3);
    expect(s.kwh).toBe(r2(SAVINGS_BASE.kwh + SAVINGS_PER_BAG.kwh * 3));
    expect(s.minutes).toBe(SAVINGS_BASE.minutes + SAVINGS_PER_BAG.minutes * 3);
  });
  it("derives CO₂ from energy via the EIA grid factor", () => {
    expect(SAVINGS_PER_BAG.co2).toBeCloseTo(SAVINGS_PER_BAG.kwh * GRID_LB_CO2_PER_KWH, 2);
  });
  it("prices each unit with the value rates", () => {
    const s = savingsFor(2);
    expect(s.value.water).toBe(r2(s.gallons * VALUE_RATES.water));
    expect(s.value.energy).toBe(r2(s.kwh * VALUE_RATES.energy));
    expect(s.value.total).toBe(r2(s.value.water + s.value.energy + s.value.co2 + s.value.time));
  });
  it("is zero for zero bags", () => {
    expect(savingsFor(0).value.total).toBe(0);
  });
});

describe("orderValue", () => {
  it("floors the real price when savings exceed the order (cap on)", () => {
    if (!CAP_REAL_PRICE) return;
    const total = 19.5;
    const { savings, realPrice } = orderValue(total, 3);
    expect(realPrice).toBe(REAL_PRICE_FLOOR);
    expect(r2(savings + realPrice)).toBe(total);
  });
  it("never returns a negative real price", () => {
    const { realPrice } = orderValue(5, 10);
    expect(realPrice).toBeGreaterThanOrEqual(0);
  });
});
