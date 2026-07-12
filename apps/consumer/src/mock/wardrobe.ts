import type { WardrobeItem } from "@rapidual/shared";

/** Demo wardrobe catalog — mirrors supabase/seed.sql + a few more. */
export const MOCK_WARDROBE: WardrobeItem[] = [
  { id: "w1", title: "Everyday crew tees (5-pack)", reason: "You wash basics most weeks", category: "basics", partner: "Target", priceFrom: 24 },
  { id: "w2", title: "Wrinkle-resist chinos", reason: "Pairs with your hang-dry setting", category: "bottoms", partner: "Costco", priceFrom: 34 },
  { id: "w3", title: "Hypoallergenic detergent refill", reason: "Matches your detergent preference", category: "care", partner: "Walmart", priceFrom: 18 },
  { id: "w4", title: "Performance quarter-zip", reason: "Cooler OC evenings ahead", category: "outerwear", partner: "Best Buy", priceFrom: 58 },
  { id: "w5", title: "Bamboo bath towels (set)", reason: "Gentle on hypoallergenic washes", category: "basics", partner: "Target", priceFrom: 42 },
  { id: "w6", title: "Cedar drawer fresheners", reason: "For your scent-free loads", category: "care", partner: "Walmart", priceFrom: 14 },
];
