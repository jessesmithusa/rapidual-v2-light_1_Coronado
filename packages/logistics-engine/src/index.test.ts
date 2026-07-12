import { describe, it, expect } from "vitest";
import { matchRoutes, estimateDualLoad } from "./index";
import type { Route } from "@rapidual/shared";

const routes: Route[] = [
  { id: "near", name: "Near", city: "Santa Ana", serviceDay: 3, loadType: "dual", utilization: 0.94, activeSubscribers: 100, parcelStops: 40, path: [{ lat: 33.7455, lng: -117.8677 }] },
  { id: "far", name: "Far", city: "LA", serviceDay: 1, loadType: "laundry", utilization: 0.8, activeSubscribers: 50, parcelStops: 0, path: [{ lat: 34.05, lng: -118.24 }] },
];

describe("matchRoutes", () => {
  it("returns nearby routes sorted by distance and filters far ones", () => {
    const matches = matchRoutes({ lat: 33.7455, lng: -117.8677 }, routes, 10);
    expect(matches[0]?.route.id).toBe("near");
    expect(matches.find((m) => m.route.id === "far")).toBeUndefined();
    expect(matches[0]?.earliestPickup).toBeTypeOf("string");
  });
});

describe("estimateDualLoad", () => {
  it("blends laundry and parcel legs into a high utilization", () => {
    const est = estimateDualLoad(routes[0]!);
    expect(est.laundryLegs).toBe(200); // 100 subscribers × 2 legs
    expect(est.parcelLegs).toBe(40);
    expect(est.projectedUtilization).toBeGreaterThan(0.9);
    expect(est.projectedUtilization).toBeLessThanOrEqual(0.99);
  });
});
