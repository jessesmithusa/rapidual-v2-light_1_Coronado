import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { driverChannel, DRIVER_LOCATION_EVENT, type DriverLocationPayload } from "@rapidual/shared";
import { supabase } from "./supabase";

/**
 * Publishes the driver's live location to the route's broadcast channel.
 * The consumer app's tracking screen subscribes to the same channel and moves
 * the van marker in real time.
 */
export function useDriverBroadcast(routeId: string | undefined, payload: DriverLocationPayload) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!routeId) return;
    const ch = supabase.channel(driverChannel(routeId), { config: { broadcast: { self: false } } });
    ch.subscribe((status) => {
      readyRef.current = status === "SUBSCRIBED";
    });
    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
      readyRef.current = false;
    };
  }, [routeId]);

  useEffect(() => {
    if (!channelRef.current || !readyRef.current) return;
    channelRef.current.send({ type: "broadcast", event: DRIVER_LOCATION_EVENT, payload });
  }, [payload.lat, payload.lng, payload.etaMinutes, payload.stage]);
}
