import { create } from "zustand";
import { fetchPoints, recordPoints } from "@/data/repo";

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
}

export interface Tier {
  name: string;
  min: number;
}

export const TIERS: Tier[] = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 1000 },
  { name: "Gold", min: 2500 },
  { name: "Platinum", min: 5000 },
];

export const REWARDS: RewardItem[] = [
  { id: "freedel", title: "Free Delivery", description: "One free pickup + re-delivery", cost: 500, icon: "bicycle" },
  { id: "express", title: "Express Service", description: "12-hour turnaround on your next order", cost: 800, icon: "flash" },
  { id: "credit5", title: "$5 Order Credit", description: "Applied to your next pickup", cost: 1000, icon: "cash" },
  { id: "off15", title: "15% Off Next Order", description: "Stack it with bag pricing", cost: 1200, icon: "pricetag" },
  { id: "priority", title: "Priority Support", description: "Front-of-line chat for 30 days", cost: 1500, icon: "headset" },
];

export const EARN_RULES = [
  { icon: "bag-handle", label: "10 points per $1 spent", points: "10×" },
  { icon: "star", label: "50 points for each order review", points: "+50" },
  { icon: "people", label: "Free $7 bag for each friend referred", points: "+$7" },
];

export function tierForPoints(points: number): { current: Tier; next: Tier | null; toNext: number; progress: number } {
  let current = TIERS[0]!;
  for (const t of TIERS) if (points >= t.min) current = t;
  const idx = TIERS.indexOf(current);
  const next = idx < TIERS.length - 1 ? TIERS[idx + 1]! : null;
  const toNext = next ? next.min - points : 0;
  const span = next ? next.min - current.min : 1;
  const progress = next ? Math.min(1, (points - current.min) / span) : 1;
  return { current, next, toNext, progress };
}

interface LoyaltyState {
  points: number;
  redeemed: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  earn: (n: number, reason?: string) => void;
  redeem: (reward: RewardItem) => boolean;
}

export const useLoyalty = create<LoyaltyState>((set, get) => ({
  points: 1240,
  redeemed: [],
  hydrated: false,
  hydrate: async () => {
    const live = await fetchPoints();
    if (live !== null) set({ points: live, hydrated: true });
  },
  earn: (n, reason = "order") => {
    set((s) => ({ points: s.points + n }));
    void recordPoints(n, reason); // no-op offline
  },
  redeem: (reward) => {
    if (get().points < reward.cost) return false;
    set((s) => ({ points: s.points - reward.cost, redeemed: [...s.redeemed, reward.id] }));
    void recordPoints(-reward.cost, `redeem:${reward.id}`);
    return true;
  },
}));
