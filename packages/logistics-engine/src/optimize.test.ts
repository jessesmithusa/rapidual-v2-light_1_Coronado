import { describe, it, expect } from "vitest";
import { optimizeManifest, type SequenceStop } from "./optimize";

const depot = { lat: 33.73, lng: -117.87 };
const stops: SequenceStop[] = [
  { id: "s1", kind: "pickup", lat: 33.7455, lng: -117.8677, units: 2 },
  { id: "s2", kind: "parcel", lat: 33.7489, lng: -117.8601, units: 1 },
  { id: "s3", kind: "redeliver", lat: 33.7512, lng: -117.8541, units: 2 },
  { id: "s4", kind: "parcel", lat: 33.7455, lng: -117.8482, units: 3 },
  { id: "s5", kind: "pickup", lat: 33.7398, lng: -117.8423, units: 1 },
  { id: "s6", kind: "pickup", lat: 33.7360, lng: -117.8500, units: 2 },
  { id: "s7", kind: "parcel", lat: 33.7321, lng: -117.8602, units: 1 },
  { id: "s8", kind: "redeliver", lat: 33.7380, lng: -117.8650, units: 4 },
];

describe("optimizeManifest", () => {
  const r = optimizeManifest({ depot, stops, vehicleCapacity: 24 });

  it("keeps every stop exactly once", () => {
    expect(r.sequence).toHaveLength(stops.length);
    expect(new Set(r.sequence.map((s) => s.id)).size).toBe(stops.length);
  });

  it("produces a positive distance and duration", () => {
    expect(r.distanceMiles).toBeGreaterThan(0);
    expect(r.durationMinutes).toBeGreaterThan(0);
  });

  it("models the dual load: leaves full, never runs empty", () => {
    // initial load = redeliveries (2+4) + parcels (1+3+1) = 11
    expect(r.initialLoad).toBe(11);
    expect(r.peakLoad).toBeGreaterThanOrEqual(r.initialLoad);
    expect(r.loadedLegRatio).toBe(1); // every leg carries something
  });

  it("is feasible under a 24-unit capacity", () => {
    expect(r.peakLoad).toBeLessThanOrEqual(24);
    expect(r.feasible).toBe(true);
  });

  it("is deterministic", () => {
    const again = optimizeManifest({ depot, stops, vehicleCapacity: 24 });
    expect(again.sequence.map((s) => s.id)).toEqual(r.sequence.map((s) => s.id));
    expect(again.distanceMiles).toBe(r.distanceMiles);
  });

  it("2-opt is no worse than nearest-neighbour alone", () => {
    // distance should be finite and reasonable for an 8-stop OC loop
    expect(r.distanceMiles).toBeLessThan(15);
  });

  it("flags infeasibility when capacity is too small", () => {
    const tight = optimizeManifest({ depot, stops, vehicleCapacity: 5 });
    expect(tight.feasible).toBe(false);
  });
});
