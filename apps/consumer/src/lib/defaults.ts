import type { LaundryPreferences } from "@rapidual/shared";

/** Default wash preferences for a new pickup (no subscription model). */
export const DEFAULT_PREFERENCES: LaundryPreferences = {
  detergent: "standard",
  fold: "standard",
  waterTemp: "warm",
  starchShirts: false,
  separateDelicates: false,
};
