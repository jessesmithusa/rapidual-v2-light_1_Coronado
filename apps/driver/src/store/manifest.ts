import { create } from "zustand";
import type { DriverManifest, ManifestStop, OrderStage } from "@rapidual/shared";
import { MOCK_MANIFEST } from "@/mock/manifest";
import { fetchLiveManifest, pushStageUpdate } from "@/data/live";
import { advanceOrderStage } from "@/lib/photos";

/** Stage an order moves to when its stop is completed. */
const NEXT_STAGE: Record<ManifestStop["kind"], OrderStage> = {
  pickup: "picked_up",
  redeliver: "delivered",
  parcel: "delivered",
};

interface ManifestState {
  manifest: DriverManifest;
  live: boolean;
  hydrate: () => Promise<void>;
  stopById: (id: string) => ManifestStop | undefined;
  completeStop: (id: string) => void;
}

export const useManifest = create<ManifestState>((set, get) => ({
  manifest: MOCK_MANIFEST,
  live: false,
  hydrate: async () => {
    const m = await fetchLiveManifest();
    if (m) set({ manifest: m, live: true });
  },

  stopById: (id) => get().manifest.stops.find((s) => s.id === id),

  completeStop: (id) => {
    set((state) => {
      const stops = state.manifest.stops.map((s) => ({ ...s }));
      const idx = stops.findIndex((s) => s.id === id);
      if (idx < 0) return state;

      const stop = stops[idx]!;
      stop.status = "done";
      if (stop.orderId) {
        stop.stage = NEXT_STAGE[stop.kind];
        advanceOrderStage(stop.orderId, stop.stage); // pushes to consumer's Realtime feed
        void pushStageUpdate(stop.id, stop.orderId, stop.stage); // persists when live
      }
      // promote the next upcoming stop to active
      const next = stops.find((s) => s.status === "upcoming");
      if (next) next.status = "active";

      return { manifest: { ...state.manifest, stops } };
    });
  },
}));
