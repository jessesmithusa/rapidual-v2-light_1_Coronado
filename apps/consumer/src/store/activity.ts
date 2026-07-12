import { create } from "zustand";
import { ACTIVITY, type ActivityItem } from "@/mock/activity";
import { fetchActivity, rescheduleOrder, cancelOrder } from "@/data/repo";

interface ActivityState {
  items: ActivityItem[];
  live: boolean; // true once real orders have loaded
  hydrate: () => Promise<void>;
  reschedule: (id: string, date: string) => void;
  cancel: (id: string) => void;
}

export const useActivity = create<ActivityState>((set) => ({
  items: ACTIVITY.map((a) => ({ ...a })),
  live: false,
  hydrate: async () => {
    const rows = await fetchActivity();
    if (rows) set({ items: rows, live: true });
  },
  reschedule: (id, date) => {
    set((s) => ({ items: s.items.map((a) => (a.id === id ? { ...a, date } : a)) }));
    void rescheduleOrder(id, new Date(date).toISOString?.() ? date : date); // best-effort live sync
  },
  cancel: (id) => {
    set((s) => ({ items: s.items.filter((a) => a.id !== id) }));
    void cancelOrder(id);
  },
}));
