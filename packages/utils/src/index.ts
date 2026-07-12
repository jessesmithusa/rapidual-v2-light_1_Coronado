import type { OrderStage } from "@rapidual/shared";
import { ORDER_STAGE_ORDER } from "@rapidual/shared";

export const currency = (usd: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd);

export const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export const timeOfDay = (iso: string): string =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const STAGE_LABELS: Record<OrderStage, string> = {
  scheduled: "Scheduled",
  driver_enroute_pickup: "Driver en route",
  picked_up: "Picked up",
  at_washhq: "At WashHQ",
  washing: "Washing",
  folding: "Folding",
  quality_check: "Quality check",
  driver_enroute_delivery: "Out for delivery",
  delivered: "Delivered",
};

export const stageLabel = (s: OrderStage): string => STAGE_LABELS[s];

/** 0..1 progress through the chain of custody. */
export const stageProgress = (s: OrderStage): number => {
  const i = ORDER_STAGE_ORDER.indexOf(s);
  return i < 0 ? 0 : i / (ORDER_STAGE_ORDER.length - 1);
};

export const etaText = (minutes: number): string =>
  minutes <= 1 ? "Arriving now" : minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} hr`;

export const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Haversine distance in miles — used by the home map "nearby routes". */
export const milesBetween = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.asin(Math.sqrt(h));
};

// ── Ladder per-bag pricing (matches Business Plan v4 §07) ─────
// The per-bag price applies to EVERY bag in the order and falls as
// bags are added: 1→$7.00 · 2→$6.50 · 3→$6.00 · 4→$5.50 · 5+→$5.00.
// So 3 bags = $18 and 5 bags = $25, exactly the investor-deck table.
/** Single-bag price. */
export const BASE_BAG_PRICE = 7;
/** Per-bag discount for each additional bag in the order. */
export const BAG_STEP = 0.5;
/** Per-bag floor, reached at 5+ bags. */
export const BAG_FLOOR = 5;
/** Same-day rush return, flat per-order upgrade. */
export const RUSH_FEE = 5;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The per-bag ladder tier for an order of `bags`. */
export const bagTierPrice = (bags: number): number =>
  Math.max(BAG_FLOOR, round2(BASE_BAG_PRICE - BAG_STEP * (Math.max(1, bags) - 1)));

const ladderTotal = (bags: number): number => round2(bags * bagTierPrice(bags));

/** Marginal cost of the nth bag (total(n) − total(n−1)) — the add-one-more carrot. */
export const marginalBagPrice = (n: number): number =>
  n <= 1 ? BASE_BAG_PRICE : round2(ladderTotal(n) - ladderTotal(n - 1));

export interface BagQuote {
  bags: number;
  total: number;
  /** blended price per bag (total ÷ bags) */
  effectivePerBag: number;
  /** marginal price of the next bag — the carrot to add one more */
  nextBagPrice: number;
  /** savings vs. paying the base price for every bag */
  savingsVsFlat: number;
  /** marginal price of each bag, in order */
  breakdown: number[];
}

export function pickupQuote(bagCount: number): BagQuote {
  const bags = Math.max(0, Math.floor(bagCount));
  const breakdown = Array.from({ length: bags }, (_, i) => marginalBagPrice(i + 1));
  const total = bags ? ladderTotal(bags) : 0;
  return {
    bags,
    total,
    effectivePerBag: bags ? bagTierPrice(bags) : 0,
    nextBagPrice: marginalBagPrice(bags + 1),
    savingsVsFlat: round2(BASE_BAG_PRICE * bags - total),
    breakdown,
  };
}

// ── Environmental & cost savings (vs. washing at home) ────────
// Grounded inputs (see SOURCES.md for citations):
//  · Standard home washer: ~20 gal water per load (ENERGY STAR, energystar.gov)
//  · Home washer energy: ~0.7 kWh/cycle; electric dryer: ~2.8 kWh/cycle (DOE/industry data)
//  · Grid carbon: ~0.81 lb CO₂ per kWh, US average (EIA, 2023)
//  · Residential electricity: ~$0.16/kWh, US average (EIA via EPA calculator)
// Explicit ASSUMPTIONS (labeled, tune before making public marketing claims):
//  · LOADS_PER_BAG: one Rapidual bag ≈ 2 home washer loads
//  · FACILITY_*_SHARE: fraction of home usage our high-efficiency facility avoids net
//  · water $/gal, CO₂ $/lb, and time $/min value rates
export const HOME_WATER_PER_LOAD_GAL = 20;   // cited
export const HOME_ENERGY_PER_LOAD_KWH = 3.5; // cited (0.7 washer + 2.8 dryer)
export const GRID_LB_CO2_PER_KWH = 0.81;     // cited (EIA 2023 US average)
export const LOADS_PER_BAG = 1.5;            // 12 lb standard bag ≈ 1.5 home machine loads (Plan §07)
export const FACILITY_WATER_SHARE = 0.75;    // net 15 gal/load saved — "~75% less water per load" (Plan §10 / tunnel-washer reclamation)
export const FACILITY_ENERGY_SHARE = 0.57;   // net 2.0 kWh/load saved (Plan §10: 3.5 home → 1.0–1.5 commercial)
export const MINUTES_PER_BAG = 38;           // ~25 min active time per load × 1.5 loads (Plan §07)

export const SAVINGS_PER_BAG = {
  gallons: Math.round(LOADS_PER_BAG * HOME_WATER_PER_LOAD_GAL * FACILITY_WATER_SHARE), // 26
  kwh: round2(LOADS_PER_BAG * HOME_ENERGY_PER_LOAD_KWH * FACILITY_ENERGY_SHARE),       // 3.5
  co2: round2(LOADS_PER_BAG * HOME_ENERGY_PER_LOAD_KWH * FACILITY_ENERGY_SHARE * GRID_LB_CO2_PER_KWH), // ≈2.84
  minutes: MINUTES_PER_BAG,
};
export const SAVINGS_BASE = { gallons: 0, kwh: 0, co2: 0, minutes: 0 };
/** Dollar value applied to each saved unit. energy is EIA-cited; others are assumptions. */
export const VALUE_RATES = { water: 0.015, energy: 0.16, co2: 0.05, time: 0.176 };

export interface SavingsBreakdown {
  gallons: number;
  kwh: number;
  co2: number;
  minutes: number;
  value: { water: number; energy: number; co2: number; time: number; total: number };
}

export function savingsFor(bagCount: number): SavingsBreakdown {
  const b = Math.max(0, Math.floor(bagCount));
  if (b === 0) return { gallons: 0, kwh: 0, co2: 0, minutes: 0, value: { water: 0, energy: 0, co2: 0, time: 0, total: 0 } };
  const gallons = SAVINGS_BASE.gallons + SAVINGS_PER_BAG.gallons * b;
  const kwh = SAVINGS_BASE.kwh + SAVINGS_PER_BAG.kwh * b;
  const co2 = SAVINGS_BASE.co2 + SAVINGS_PER_BAG.co2 * b;
  const minutes = SAVINGS_BASE.minutes + SAVINGS_PER_BAG.minutes * b;
  const water = round2(gallons * VALUE_RATES.water);
  const energy = round2(kwh * VALUE_RATES.energy);
  const co2v = round2(co2 * VALUE_RATES.co2);
  const time = round2(minutes * VALUE_RATES.time);
  return { gallons, kwh, co2, minutes, value: { water, energy, co2: co2v, time, total: round2(water + energy + co2v + time) } };
}

/** The smallest "real order price" we ever show (keeps a token amount visible). */
export const REAL_PRICE_FLOOR = 0.47;
/** When false, the panel shows the full uncapped environmental value instead of flooring the price. */
export const CAP_REAL_PRICE = true;

/**
 * Splits an order into the value-of-savings shown and the "real" price paid.
 * The applied savings is capped so the real price floors at REAL_PRICE_FLOOR —
 * matching the marketing reframe (savings + realPrice = orderTotal).
 */
export function orderValue(orderTotal: number, bagCount: number): { savings: number; realPrice: number } {
  const raw = savingsFor(bagCount).value.total;
  if (!CAP_REAL_PRICE) {
    return { savings: raw, realPrice: Math.max(0, round2(orderTotal - raw)) };
  }
  if (raw >= orderTotal - REAL_PRICE_FLOOR) {
    const realPrice = Math.min(orderTotal, REAL_PRICE_FLOOR);
    return { savings: round2(orderTotal - realPrice), realPrice: round2(realPrice) };
  }
  return { savings: raw, realPrice: round2(orderTotal - raw) };
}

/** The "real" order price after deducting the (capped) value of savings. */
export function realOrderPrice(orderTotal: number, bagCount: number): number {
  return orderValue(orderTotal, bagCount).realPrice;
}

// ── Predicted pickup (from order history) ─────────────────────
export interface PickupPrediction {
  weekday: number; // 0 = Sun … 6 = Sat
  typicalBags: number;
  confidence: number; // 0..1
}

export function predictPickup(history: { weekday: number; bags: number }[]): PickupPrediction | null {
  if (history.length === 0) return null;
  const counts: Record<number, number> = {};
  for (const h of history) counts[h.weekday] = (counts[h.weekday] ?? 0) + 1;
  const weekday = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0]);
  const onDay = history.filter((h) => h.weekday === weekday).map((h) => h.bags).sort((a, b) => a - b);
  const typicalBags = onDay[Math.floor(onDay.length / 2)] ?? 1;
  const confidence = Math.min(1, round2(counts[weekday]! / history.length + (history.length >= 4 ? 0.1 : 0)));
  return { weekday, typicalBags, confidence };
}

// ── Driver payout ─────────────────────────────────────────────
export interface PayoutSummary {
  stops: number;
  base: number;
  perStopPay: number;
  tips: number;
  total: number;
}

export function driverPayout(stops: number, tips: number, opts?: { base?: number; perStop?: number }): PayoutSummary {
  const base = opts?.base ?? 18;
  const per = opts?.perStop ?? 3.5;
  const perStopPay = round2(per * stops);
  return { stops, base, perStopPay, tips: round2(tips), total: round2(base + perStopPay + round2(tips)) };
}

// ── Lifetime sustainability impact ────────────────────────────
export interface LifetimeImpact {
  gallons: number;
  kwh: number;
  co2: number;
  minutes: number;
  value: number;
}

export function lifetimeSavings(bagCounts: number[]): LifetimeImpact {
  return bagCounts.reduce<LifetimeImpact>(
    (acc, b) => {
      const s = savingsFor(b);
      return {
        gallons: acc.gallons + s.gallons,
        kwh: acc.kwh + s.kwh,
        co2: acc.co2 + s.co2,
        minutes: acc.minutes + s.minutes,
        value: round2(acc.value + s.value.total),
      };
    },
    { gallons: 0, kwh: 0, co2: 0, minutes: 0, value: 0 },
  );
}
