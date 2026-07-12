import { create } from "zustand";
import { fetchInbox, markInboxRead } from "@/data/repo";

export interface Notif {
  id: string;
  title: string;
  body: string;
  at: string;
  icon: string;
  read: boolean;
}

const SEED: Notif[] = [
  { id: "n1", title: "Your driver is on your street", body: "Maya is 2 minutes away for pickup.", at: "4:28 PM", icon: "navigate", read: false },
  { id: "n2", title: "Laundry is ready", body: "3 bags washed, dried, and folded — out for delivery.", at: "1:10 PM", icon: "shirt", read: false },
  { id: "n3", title: "You earned 195 Rapid Points", body: "Thanks for your order — points added to your balance.", at: "Yesterday", icon: "star", read: true },
  { id: "n4", title: "Pickup reminder", body: "Your standing Tuesday pickup is tomorrow. Need an extra bag?", at: "Mon", icon: "calendar", read: true },
];

const timeago = (iso: string) => {
  const d = new Date(iso), now = Date.now(), mins = Math.round((now - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 60 * 24) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

interface NotifState {
  enabled: boolean;
  items: Notif[];
  live: boolean;
  hydrate: () => Promise<void>;
  setEnabled: (b: boolean) => void;
  markAllRead: () => void;
  push: (n: Omit<Notif, "id" | "read">) => void;
}

export const useNotifications = create<NotifState>((set) => ({
  enabled: true,
  items: SEED,
  live: false,
  hydrate: async () => {
    const rows = await fetchInbox();
    if (rows) set({
      live: true,
      items: rows.map((r) => ({ id: r.id, title: r.title, body: r.body, icon: r.icon, read: r.read, at: timeago(r.created_at) })),
    });
  },
  setEnabled: (enabled) => set({ enabled }),
  markAllRead: () => {
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
    void markInboxRead();
  },
  push: (n) => set((s) => ({ items: [{ ...n, id: `n${Date.now()}`, read: false }, ...s.items] })),
}));
