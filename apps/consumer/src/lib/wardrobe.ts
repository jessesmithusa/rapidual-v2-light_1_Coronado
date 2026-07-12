import type { LaundryPreferences, WardrobeItem } from "@rapidual/shared";
import { supabase } from "./supabase";
import { MOCK_WARDROBE } from "@/mock/wardrobe";

interface WardrobeRow {
  id: string;
  title: string;
  reason: string;
  category: string;
  image_url: string | null;
  partner: string | null;
  price_from: number | null;
}

/** Fetch the wardrobe catalog; falls back to mock data before the DB is connected. */
export async function fetchWardrobe(): Promise<WardrobeItem[]> {
  try {
    const { data, error } = await supabase.from("wardrobe_items").select("*");
    if (!error && data && data.length) {
      return (data as WardrobeRow[]).map((r) => ({
        id: r.id,
        title: r.title,
        reason: r.reason,
        category: r.category as WardrobeItem["category"],
        imageUrl: r.image_url ?? undefined,
        partner: r.partner ?? undefined,
        priceFrom: r.price_from ?? undefined,
      }));
    }
  } catch {
    // fall through
  }
  return MOCK_WARDROBE;
}

/**
 * Closed-Loop Commerce: rank recommendations by the member's wash profile, so
 * suggestions ride the same route as their next laundry delivery.
 */
export function rankForProfile(items: WardrobeItem[], prefs: LaundryPreferences): WardrobeItem[] {
  const score = (it: WardrobeItem): number => {
    const hay = `${it.title} ${it.reason}`.toLowerCase();
    let s = 0;
    if (prefs.detergent === "hypoallergenic" && /hypoallergenic|bamboo|gentle|soft/.test(hay)) s += 3;
    if (prefs.detergent === "scent_free" && /scent|fresh|cedar/.test(hay)) s += 3;
    if (prefs.fold === "hang_dry" && /wrinkle|hang|chino|shirt|zip/.test(hay)) s += 2;
    if (prefs.separateDelicates && /delicate|silk|wool|bamboo/.test(hay)) s += 1;
    if (it.category === "care") s += 1;
    return s;
  };
  return [...items].sort((a, b) => score(b) - score(a));
}
