import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { productById } from "@/mock/catalog";

interface CartState {
  items: Record<string, number>; // productId -> qty
  add: (productId: string) => void;
  dec: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
  items: {},
  add: (id) => set((s) => ({ items: { ...s.items, [id]: (s.items[id] ?? 0) + 1 } })),
  dec: (id) =>
    set((s) => {
      const next = (s.items[id] ?? 0) - 1;
      const items = { ...s.items };
      if (next <= 0) delete items[id];
      else items[id] = next;
      return { items };
    }),
  remove: (id) =>
    set((s) => {
      const items = { ...s.items };
      delete items[id];
      return { items };
    }),
  clear: () => set({ items: {} }),
  count: () => Object.values(get().items).reduce((a, b) => a + b, 0),
  subtotal: () =>
    Math.round(
      Object.entries(get().items).reduce((sum, [id, qty]) => sum + (productById(id)?.price ?? 0) * qty, 0) * 100,
    ) / 100,
    }),
    { name: "rapidual-cart", storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ items: s.items }) },
  ),
);
