import { create } from "zustand";
import { fetchStanding, saveStanding } from "@/data/repo";

interface RecurringState {
  active: boolean;
  weekday: number; // 0 = Sun … 6 = Sat
  bags: number;
  hydrate: () => Promise<void>;
  setActive: (b: boolean) => void;
  setWeekday: (d: number) => void;
  setBags: (n: number) => void;
}

const sync = (s: { active: boolean; weekday: number; bags: number }) => void saveStanding(s); // no-op offline

export const useRecurring = create<RecurringState>((set, get) => ({
  active: false,
  weekday: 2, // Tuesday
  bags: 3,
  hydrate: async () => {
    const live = await fetchStanding();
    if (live) set(live);
  },
  setActive: (active) => { set({ active }); sync({ ...get(), active }); },
  setWeekday: (weekday) => { set({ weekday }); sync({ ...get(), weekday }); },
  setBags: (bags) => { const b = Math.max(1, bags); set({ bags: b }); sync({ ...get(), bags: b }); },
}));
