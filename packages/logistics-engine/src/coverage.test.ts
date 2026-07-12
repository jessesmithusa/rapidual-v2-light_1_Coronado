import { describe, it, expect } from "vitest";
import { isAddressServed, routeForAddress, slotStatus } from "./index";
import type { Route } from "@rapidual/shared";

const routes: Route[] = [
  { id: "sa", name: "Santa Ana Central", city: "Santa Ana", serviceDay: 3, loadType: "dual", utilization: 0.94, activeSubscribers: 120, parcelStops: 40, path: [{ lat: 33.7455, lng: -117.8677 }] },
];

describe("coverage", () => {
  it("serves a nearby address and rejects a far one", () => {
    expect(isAddressServed({ lat: 33.7458, lng: -117.868 }, routes)).toBe(true);
    expect(isAddressServed({ lat: 40.7128, lng: -74.006 }, routes)).toBe(false); // NYC
  });
  it("returns the nearest route or null", () => {
    expect(routeForAddress({ lat: 33.7458, lng: -117.868 }, routes)?.id).toBe("sa");
    expect(routeForAddress({ lat: 40.7128, lng: -74.006 }, routes)).toBeNull();
  });
});

describe("slotStatus", () => {
  it("computes remaining capacity and flags", () => {
    expect(slotStatus(0).remaining).toBe(60);
    expect(slotStatus(60).full).toBe(true);
    expect(slotStatus(52).almostFull).toBe(true); // 8 left of 60
  });
});
