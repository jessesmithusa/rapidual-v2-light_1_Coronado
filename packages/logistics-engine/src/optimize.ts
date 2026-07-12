import type { StopKind } from "@rapidual/shared";
import { milesBetween } from "@rapidual/utils";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SequenceStop extends LatLng {
  id: string;
  kind: StopKind;
  /** bag-equivalent units handled here (bags for laundry, parcels for parcel stops) */
  units: number;
}

export interface OptimizeInput {
  depot: LatLng; // WashHQ
  stops: SequenceStop[];
  vehicleCapacity?: number; // units
  avgSpeedMph?: number;
  serviceMinutesPerStop?: number;
}

export interface LegLoad {
  afterStopId: string;
  load: number;
}

export interface OptimizedRoute {
  sequence: SequenceStop[];
  distanceMiles: number;
  durationMinutes: number;
  initialLoad: number;
  peakLoad: number;
  capacity: number;
  /** how full at the fullest point (peak / capacity) */
  fill: number;
  /** average load while moving ÷ peak load — how "loaded both directions" the run is */
  utilization: number;
  /** fraction of legs the truck travels non-empty */
  loadedLegRatio: number;
  feasible: boolean;
  laundryLegs: number;
  parcelLegs: number;
  loadProfile: LegLoad[];
}

const dist = (a: LatLng, b: LatLng) => milesBetween(a, b);

function routeDistance(depot: LatLng, order: SequenceStop[]): number {
  if (order.length === 0) return 0;
  let total = dist(depot, order[0]!);
  for (let i = 0; i < order.length - 1; i++) total += dist(order[i]!, order[i + 1]!);
  total += dist(order[order.length - 1]!, depot); // return to WashHQ with the day's pickups
  return total;
}

/** Greedy nearest-neighbour construction from the depot. */
function nearestNeighbor(depot: LatLng, stops: SequenceStop[]): SequenceStop[] {
  const remaining = [...stops];
  const order: SequenceStop[] = [];
  let cur: LatLng = depot;
  while (remaining.length) {
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = dist(cur, remaining[i]!);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    const next = remaining.splice(bestI, 1)[0]!;
    order.push(next);
    cur = next;
  }
  return order;
}

/** 2-opt local improvement on the constructed tour. */
function twoOpt(depot: LatLng, initial: SequenceStop[]): SequenceStop[] {
  let best = initial.slice();
  let bestDist = routeDistance(depot, best);
  let improved = true;
  let guard = 0;
  while (improved && guard < 60) {
    improved = false;
    guard++;
    for (let i = 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const candidate = best
          .slice(0, i)
          .concat(best.slice(i, k + 1).reverse(), best.slice(k + 1));
        const d = routeDistance(depot, candidate);
        if (d + 1e-9 < bestDist) {
          best = candidate;
          bestDist = d;
          improved = true;
        }
      }
    }
  }
  return best;
}

/**
 * Models the dual-load: the van leaves WashHQ carrying every re-delivery + parcel,
 * sheds load as it delivers, and picks load back up at laundry pickups — so it
 * rarely runs empty in either direction.
 */
function computeLoad(order: SequenceStop[]) {
  const initialLoad = order
    .filter((s) => s.kind !== "pickup")
    .reduce((a, s) => a + s.units, 0);

  let load = initialLoad;
  let peak = initialLoad;
  let legSum = 0; // load carried on each travel leg
  let loadedLegs = 0;
  const profile: LegLoad[] = [];

  for (const s of order) {
    legSum += load; // leg arriving at this stop carried `load`
    if (load > 0) loadedLegs++;
    load = s.kind === "pickup" ? load + s.units : Math.max(0, load - s.units);
    if (load > peak) peak = load;
    profile.push({ afterStopId: s.id, load });
  }
  // final leg back to the depot carries the accumulated pickups
  legSum += load;
  if (load > 0) loadedLegs++;

  const totalLegs = order.length + 1;
  const averageLoad = totalLegs ? legSum / totalLegs : 0;
  return { initialLoad, peakLoad: peak, averageLoad, loadedLegs, totalLegs, profile };
}

export function optimizeManifest(input: OptimizeInput): OptimizedRoute {
  const capacity = input.vehicleCapacity ?? 24;
  const speed = input.avgSpeedMph ?? 18;
  const service = input.serviceMinutesPerStop ?? 4;

  const sequence = twoOpt(input.depot, nearestNeighbor(input.depot, input.stops));
  const distanceMiles = routeDistance(input.depot, sequence);
  const { initialLoad, peakLoad, averageLoad, loadedLegs, totalLegs, profile } = computeLoad(sequence);
  const durationMinutes = Math.round((distanceMiles / speed) * 60 + service * sequence.length);

  return {
    sequence,
    distanceMiles: Number(distanceMiles.toFixed(2)),
    durationMinutes,
    initialLoad,
    peakLoad,
    capacity,
    fill: Number(Math.min(1, peakLoad / capacity).toFixed(3)),
    utilization: Number(Math.min(0.99, peakLoad ? averageLoad / peakLoad : 0).toFixed(3)),
    loadedLegRatio: Number((loadedLegs / totalLegs).toFixed(3)),
    feasible: peakLoad <= capacity,
    laundryLegs: sequence.filter((s) => s.kind !== "parcel").length,
    parcelLegs: sequence.filter((s) => s.kind === "parcel").length,
    loadProfile: profile,
  };
}
