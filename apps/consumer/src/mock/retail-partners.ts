export interface RetailPartner {
  id: string;
  name: string;
  short: string; // tile initials (placeholder for the brand logo)
  accent: string;
  available: boolean;
  linked: boolean; // default link state
  category: string;
  rating: number;
  etaMinutes: number;
  minOrder: number;
  deal?: string;
}

// Real retailer names (nominative). Logo art is intentionally a placeholder —
// official brand assets get added under partner agreements.
export const RETAIL_PARTNERS: RetailPartner[] = [
  // ── Live in the Orange County pilot (Business Plan v4 §02) ──
  { id: "target", name: "Target", short: "T", accent: "#CC0000", available: true, linked: true, category: "Essentials", rating: 4.7, etaMinutes: 75, minOrder: 20, deal: "Free delivery over $35" },
  { id: "homedepot", name: "The Home Depot", short: "HD", accent: "#F96302", available: true, linked: false, category: "Home", rating: 4.5, etaMinutes: 120, minOrder: 30, deal: "Same-day on tools" },
  { id: "lowes", name: "Lowe's", short: "L", accent: "#004990", available: true, linked: false, category: "Home", rating: 4.5, etaMinutes: 120, minOrder: 30 },
  { id: "ulta", name: "Ulta Beauty", short: "U", accent: "#E4258C", available: true, linked: false, category: "Beauty", rating: 4.8, etaMinutes: 90, minOrder: 15, deal: "Free gift over $40" },
  { id: "kohls", name: "Kohl's", short: "K", accent: "#7E5A3C", available: true, linked: false, category: "Apparel", rating: 4.4, etaMinutes: 150, minOrder: 25, deal: "Buy 2 get 1" },
  // ── Anchor targets — coming soon (Tier 1 in the merchant playbook) ──
  { id: "walmart", name: "Walmart", short: "W", accent: "#0071CE", available: false, linked: false, category: "Groceries", rating: 0, etaMinutes: 0, minOrder: 0, deal: "Coming soon" },
  { id: "costco", name: "Costco", short: "C", accent: "#E31837", available: false, linked: false, category: "Groceries", rating: 0, etaMinutes: 0, minOrder: 0, deal: "Coming soon" },
  { id: "bestbuy", name: "Best Buy", short: "BB", accent: "#0046BE", available: false, linked: false, category: "Electronics", rating: 0, etaMinutes: 0, minOrder: 0, deal: "Coming soon" },
];

export const PARTNER_CATEGORIES = [
  "All",
  ...Array.from(new Set(RETAIL_PARTNERS.filter((p) => p.available).map((p) => p.category))),
];
