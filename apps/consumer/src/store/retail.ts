import { create } from "zustand";
import { RETAIL_PARTNERS } from "@/mock/retail-partners";

interface RetailState {
  linked: Record<string, boolean>;
  toggle: (id: string) => void;
  isLinked: (id: string) => boolean;
  count: () => number;
}

export const useRetail = create<RetailState>((set, get) => ({
  linked: Object.fromEntries(RETAIL_PARTNERS.map((p) => [p.id, p.linked])),
  toggle: (id) => set((s) => ({ linked: { ...s.linked, [id]: !s.linked[id] } })),
  isLinked: (id) => !!get().linked[id],
  count: () => Object.values(get().linked).filter(Boolean).length,
}));
