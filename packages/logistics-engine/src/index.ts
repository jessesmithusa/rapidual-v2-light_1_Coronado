/**
 * @rapidual/logistics-engine — STUB.
 *
 * The "Dual" in Rapidual: every route is loaded both directions. This package
 * will eventually own the optimization that co-schedules laundry pickups/
 * re-deliveries with same-day parcel legs to keep utilization above 94%.
 *
 * For the MVP it exposes typed, deterministic stubs the consumer app can call
 * so the UI is wired to a real interface from day one.
 */
import type { Route } from "@rapidual/shared";
import { milesBetween } from "@rapidual/utils";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteMatch {
  route: Route;
  distanceMiles: number;
  /** soonest serviceable pickup as ISO date */
  earliestPickup: string;
}

/** Find routes near an origin coordinate, nearest first. */
export function matchRoutes(origin: LatLng, routes: Route[], maxMiles = 8): RouteMatch[] {
  const now = new Date();
  return routes
    .map((route) => {
      const anchor = route.path[0] ?? { lat: 0, lng: 0 };
      const distanceMiles = milesBetween(origin, anchor);
      const daysAhead = (route.serviceDay - now.getDay() + 7) % 7 || 7;
      const earliest = new Date(now);
      earliest.setDate(now.getDate() + daysAhead);
      return { route, distanceMiles, earliestPickup: earliest.toISOString() };
    })
    .filter((m) => m.distanceMiles <= maxMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

export interface DualLoadEstimate {
  laundryLegs: number;
  parcelLegs: number;
  projectedUtilization: number;
}

/**
 * Placeholder for the dual-load co-scheduling math. Returns a naive blended
 * utilization so dashboards/marketing surfaces have something to render.
 */
export function estimateDualLoad(route: Route): DualLoadEstimate {
  const laundryLegs = route.activeSubscribers * 2; // pickup + re-deliver
  const parcelLegs = route.parcelStops;
  const total = laundryLegs + parcelLegs;
  const capacity = Math.max(total, 1) * 1.06; // ~94% target headroom
  return {
    laundryLegs,
    parcelLegs,
    projectedUtilization: Math.min(0.99, total / capacity),
  };
}

export * from "./optimize";

// ── Coverage & capacity-aware scheduling ──────────────────────
export const ROUTE_DAILY_BAG_CAPACITY = 60;

/** True when the coordinates fall on a serviced route. */
export function isAddressServed(coords: LatLng, routes: Route[], maxMiles = 10): boolean {
  return matchRoutes(coords, routes, maxMiles).length > 0;
}

/** The nearest serviceable route for an address (or null if out of area). */
export function routeForAddress(coords: LatLng, routes: Route[], maxMiles = 10): Route | null {
  return matchRoutes(coords, routes, maxMiles)[0]?.route ?? null;
}

export interface SlotStatus {
  remaining: number;
  capacity: number;
  full: boolean;
  almostFull: boolean;
}

/** Remaining capacity for a pickup slot given bags already committed. */
export function slotStatus(committedBags: number, capacity = ROUTE_DAILY_BAG_CAPACITY): SlotStatus {
  const remaining = Math.max(0, capacity - committedBags);
  return { remaining, capacity, full: remaining <= 0, almostFull: remaining > 0 && remaining <= Math.ceil(capacity * 0.15) };
}
