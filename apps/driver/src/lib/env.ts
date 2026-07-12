/** Typed, validated access to EXPO_PUBLIC_* env vars. */
function required(key: string, value: string | undefined): string {
  if (!value || value.startsWith("YOUR_")) {
    // Don't hard-crash in the skeleton — warn so the app still boots for UI dev.
    console.warn(`[env] Missing ${key}. Set it in apps/consumer/.env`);
    return value ?? "";
  }
  return value;
}

export const env = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "",
  stripeKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
} as const;
