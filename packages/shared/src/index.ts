/**
 * @rapidual/shared — domain types shared across the consumer app, the
 * logistics engine, and (eventually) the driver/ops apps. These mirror the
 * Supabase schema in /supabase/migrations.
 */

// ── Plans ──────────────────────────────────────────────────
export type PlanTier = "starter" | "household" | "premium";

export interface Plan {
  tier: PlanTier;
  name: string;
  /** USD per month */
  price: number;
  /** bags included per week */
  bagsPerWeek: number;
  cadence: "weekly";
  features: string[];
  /** Stripe price id (per environment) */
  stripePriceId?: string;
}

// ── Preferences ────────────────────────────────────────────
export type Detergent = "standard" | "hypoallergenic" | "eco" | "scent_free";
export type FoldStyle = "standard" | "hang_dry" | "kondo" | "ranger_roll";
export type WaterTemp = "cold" | "warm" | "hot";

export interface LaundryPreferences {
  detergent: Detergent;
  fold: FoldStyle;
  waterTemp: WaterTemp;
  starchShirts: boolean;
  separateDelicates: boolean;
  notes?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanTier;
  status: "active" | "paused" | "canceled" | "trialing";
  /** ISO day-of-week the route hits this address, 0=Sun */
  pickupDay: number;
  preferences: LaundryPreferences;
  nextPickupAt: string; // ISO
  skippedWeeks: string[]; // ISO dates of skipped pickups
  stripeSubscriptionId?: string;
  createdAt: string;
}

// ── Addresses ──────────────────────────────────────────────
export interface Address {
  id: string;
  label: string; // "Home", "Office"
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  routeId?: string;
}

// ── Orders / chain-of-custody ──────────────────────────────
export type OrderStage =
  | "scheduled"
  | "driver_enroute_pickup"
  | "picked_up"
  | "at_washhq"
  | "washing"
  | "folding"
  | "quality_check"
  | "driver_enroute_delivery"
  | "delivered";

export const ORDER_STAGE_ORDER: OrderStage[] = [
  "scheduled",
  "driver_enroute_pickup",
  "picked_up",
  "at_washhq",
  "washing",
  "folding",
  "quality_check",
  "driver_enroute_delivery",
  "delivered",
];

export interface CustodyPhoto {
  id: string;
  stage: OrderStage;
  url: string;
  capturedAt: string;
  capturedBy: "customer" | "driver" | "washhq";
}

export interface Order {
  id: string;
  userId: string;
  subscriptionId?: string;
  addressId: string;
  routeId: string;
  stage: OrderStage;
  bagCount: number;
  /** per-bag (non-subscription) price in USD, if applicable */
  perBagPrice?: number;
  scheduledFor: string; // ISO
  preferences: LaundryPreferences;
  photos: CustodyPhoto[];
  driver?: DriverSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface DriverSnapshot {
  id: string;
  name: string;
  vehicle: string;
  lat: number;
  lng: number;
  /** ETA in minutes to the relevant stop */
  etaMinutes: number;
}

// ── Routes (the "dual" core) ───────────────────────────────
export type RouteLoadType = "laundry" | "parcel" | "dual";

export interface Route {
  id: string;
  name: string; // "OC-Irvine-North"
  city: string;
  /** 0=Sun service day */
  serviceDay: number;
  loadType: RouteLoadType;
  /** % of capacity used both directions — the 94%+ thesis */
  utilization: number;
  /** simplified path for the map */
  path: { lat: number; lng: number }[];
  activeSubscribers: number;
  parcelStops: number;
}

// ── Wardrobe / Closed-Loop Commerce (placeholder) ──────────
export interface WardrobeItem {
  id: string;
  title: string;
  reason: string; // why recommended
  category: "tops" | "bottoms" | "outerwear" | "basics" | "care";
  imageUrl?: string;
  partner?: string; // Target, Costco…
  priceFrom?: number;
}

// ── Driver manifest (the "dual" load, ops side) ────────────
export type StopKind = "pickup" | "redeliver" | "parcel";

export interface ManifestStop {
  id: string;
  seq: number;
  kind: StopKind;
  customerName: string; // or partner name for parcels
  address: string;
  lat: number;
  lng: number;
  status: "done" | "active" | "upcoming";
  /** laundry */
  bagCount?: number;
  preferences?: LaundryPreferences;
  orderId?: string;
  stage?: OrderStage;
  /** parcel */
  parcelCount?: number;
  partner?: string;
  /** delivery window */
  windowStart?: string;
  windowEnd?: string;
  notes?: string;
}

export interface DriverManifest {
  routeId: string;
  routeName: string;
  serviceDay: number;
  driver: { name: string; vehicle: string };
  utilization: number;
  stops: ManifestStop[];
}

// ── Realtime: driver live-location broadcast ───────────────
/** Broadcast channel a driver publishes to and consumers subscribe to. */
export const driverChannel = (routeId: string) => `route:${routeId}`;
export const DRIVER_LOCATION_EVENT = "driver_location";

export interface DriverLocationPayload {
  lat: number;
  lng: number;
  etaMinutes: number;
  stage?: OrderStage;
}
