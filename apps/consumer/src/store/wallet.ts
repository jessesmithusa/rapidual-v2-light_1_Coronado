import { create } from "zustand";
import { listSavedCards, presentAddCard, detachCard, setDefaultCard, type StripeCard } from "@/lib/payments";

export type SavedCard = StripeCard;

const MOCK: SavedCard[] = [
  { id: "c1", brand: "Visa", last4: "4242", exp: "08/27", isDefault: true },
  { id: "c2", brand: "Mastercard", last4: "5566", exp: "11/26", isDefault: false },
];

interface WalletState {
  cards: SavedCard[];
  live: boolean; // true once Stripe-backed cards have loaded
  busy: boolean;
  hydrate: () => Promise<void>;
  addCard: () => Promise<{ ok: boolean; message: string }>;
  makeDefault: (id: string) => void;
  remove: (id: string) => void;
}

export const useWallet = create<WalletState>((set, get) => ({
  cards: MOCK,
  live: false,
  busy: false,
  hydrate: async () => {
    const cards = await listSavedCards();
    if (cards) set({ cards, live: true });
  },
  addCard: async () => {
    set({ busy: true });
    const res = await presentAddCard();
    if (res.ok) await get().hydrate();
    set({ busy: false });
    return res;
  },
  makeDefault: (id) => {
    set((s) => ({ cards: s.cards.map((c) => ({ ...c, isDefault: c.id === id })) }));
    if (get().live) void setDefaultCard(id);
  },
  remove: (id) => {
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
    if (get().live) void detachCard(id);
  },
}));
