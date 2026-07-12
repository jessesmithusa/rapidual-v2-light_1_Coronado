import { describe, it, expect } from "vitest";
import { currency, stageProgress, etaText, milesBetween, daysOfWeek, stageLabel } from "./index";

describe("currency", () => {
  it("formats USD", () => {
    expect(currency(149)).toBe("$149.00");
    expect(currency(0)).toBe("$0.00");
  });
});

describe("stageProgress", () => {
  it("is 0 at scheduled and 1 at delivered", () => {
    expect(stageProgress("scheduled")).toBe(0);
    expect(stageProgress("delivered")).toBe(1);
  });
  it("is monotonically increasing", () => {
    expect(stageProgress("washing")).toBeGreaterThan(stageProgress("picked_up"));
  });
});

describe("stageLabel", () => {
  it("labels known stages", () => {
    expect(stageLabel("at_washhq")).toBe("At WashHQ");
    expect(stageLabel("driver_enroute_delivery")).toBe("Out for delivery");
  });
});

describe("etaText", () => {
  it("handles now, minutes, and hours", () => {
    expect(etaText(1)).toBe("Arriving now");
    expect(etaText(15)).toBe("15 min");
    expect(etaText(90)).toBe("2 hr");
  });
});

describe("milesBetween", () => {
  it("is ~0 for identical points", () => {
    const p = { lat: 33.74, lng: -117.86 };
    expect(milesBetween(p, p)).toBeCloseTo(0, 5);
  });
  it("computes a sane OC distance (Santa Ana → Irvine ~5-8 mi)", () => {
    const d = milesBetween({ lat: 33.7455, lng: -117.8677 }, { lat: 33.6846, lng: -117.8265 });
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(8);
  });
});

describe("daysOfWeek", () => {
  it("has 7 entries starting Sunday", () => {
    expect(daysOfWeek).toHaveLength(7);
    expect(daysOfWeek[0]).toBe("Sun");
    expect(daysOfWeek[3]).toBe("Wed");
  });
});
