import { create } from "zustand";
import { fetchImpactBags } from "@/data/repo";

interface ImpactState {
  bags: number[]; // bag count per past order
  hydrate: () => Promise<void>;
  add: (bags: number) => void;
}

// Seeded with a few past orders so the lifetime stat reads non-zero.
export const useImpact = create<ImpactState>((set) => ({
  bags: [4, 3, 2, 3, 2, 3],
  hydrate: async () => {
    const live = await fetchImpactBags();
    if (live) set({ bags: live });
  },
  add: (b) => set((s) => ({ bags: [...s.bags, b] })),
}));
