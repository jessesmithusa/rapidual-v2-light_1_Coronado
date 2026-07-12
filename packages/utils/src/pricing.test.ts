import { describe, it, expect } from "vitest";
import { pickupQuote, bagTierPrice, marginalBagPrice, BAG_FLOOR, BASE_BAG_PRICE, RUSH_FEE } from "./index";

describe("ladder pricing (Business Plan v4 §07 table)", () => {
  it("matches the investor-deck totals exactly", () => {
    expect(pickupQuote(1).total).toBe(7);
    expect(pickupQuote(2).total).toBe(13);
    expect(pickupQuote(3).total).toBe(18);
    expect(pickupQuote(4).total).toBe(22);
    expect(pickupQuote(5).total).toBe(25);
    expect(pickupQuote(6).total).toBe(30); // 5+ holds $5/bag
  });
  it("applies one tier price to every bag in the order", () => {
    expect(bagTierPrice(1)).toBe(7);
    expect(bagTierPrice(3)).toBe(6);
    expect(bagTierPrice(5)).toBe(BAG_FLOOR);
    expect(bagTierPrice(12)).toBe(BAG_FLOOR);
    expect(pickupQuote(3).effectivePerBag).toBe(6);
  });
  it("exposes the add-one-more carrot as a true marginal", () => {
    expect(marginalBagPrice(1)).toBe(BASE_BAG_PRICE);
    expect(marginalBagPrice(4)).toBe(4);  // 22 − 18
    expect(marginalBagPrice(5)).toBe(3);  // 25 − 22 — the cheapest add
    expect(marginalBagPrice(6)).toBe(5);  // flat tier resumes
    const q = pickupQuote(4);
    expect(q.nextBagPrice).toBe(3);
  });
  it("breakdown of marginals sums to the ladder total", () => {
    const q = pickupQuote(5);
    expect(Math.round(q.breakdown.reduce((a, b) => a + b, 0) * 100) / 100).toBe(q.total);
  });
  it("savings vs flat $7 and zero-bag edge", () => {
    expect(pickupQuote(3).savingsVsFlat).toBe(3); // 21 − 18
    expect(pickupQuote(0).total).toBe(0);
    expect(pickupQuote(0).effectivePerBag).toBe(0);
  });
  it("rush is a flat per-order fee", () => {
    expect(RUSH_FEE).toBe(5);
  });
});
