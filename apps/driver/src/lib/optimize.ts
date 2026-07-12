import { optimizeManifest, type OptimizedRoute, type SequenceStop } from "@rapidual/logistics-engine";
import type { DriverManifest, ManifestStop } from "@rapidual/shared";
import { WASHHQ } from "@/mock/manifest";

const VEHICLE_CAPACITY = 24;

function toSequence(stops: ManifestStop[]): SequenceStop[] {
  return stops.map((s) => ({
    id: s.id,
    kind: s.kind,
    lat: s.lat,
    lng: s.lng,
    units: s.kind === "parcel" ? s.parcelCount ?? 1 : s.bagCount ?? 1,
  }));
}

/** Optimize the whole day's route from WashHQ. */
export function planFullDay(m: DriverManifest): OptimizedRoute {
  return optimizeManifest({ depot: WASHHQ, stops: toSequence(m.stops), vehicleCapacity: VEHICLE_CAPACITY });
}

/** Optimize the remaining (not-yet-done) stops from the driver's current position. */
export function planRemaining(m: DriverManifest, from: { lat: number; lng: number }): OptimizedRoute {
  const remaining = m.stops.filter((s) => s.status !== "done");
  return optimizeManifest({ depot: from, stops: toSequence(remaining), vehicleCapacity: VEHICLE_CAPACITY });
}
