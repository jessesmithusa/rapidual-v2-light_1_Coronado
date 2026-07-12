import { useEffect } from "react";
import { supabase } from "./supabase";
import { useLoyalty } from "@/store/loyalty";
import { useActivity } from "@/store/activity";
import { useRecurring } from "@/store/recurring";
import { useNotifications } from "@/store/notifications";
import { useImpact } from "@/store/impact";
import { useWallet } from "@/store/wallet";

/** Pulls every live-backed store once per sign-in. Safe no-ops offline. */
export function hydrateAll(): void {
  void useLoyalty.getState().hydrate();
  void useActivity.getState().hydrate();
  void useRecurring.getState().hydrate();
  void useNotifications.getState().hydrate();
  void useImpact.getState().hydrate();
  void useWallet.getState().hydrate();
}

export function useLiveHydration(): void {
  useEffect(() => {
    hydrateAll();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") hydrateAll();
    });
    return () => sub.subscription.unsubscribe();
  }, []);
}
