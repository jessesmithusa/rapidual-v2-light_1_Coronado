import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  driverChannel,
  DRIVER_LOCATION_EVENT,
  type CustodyPhoto,
  type DriverLocationPayload,
  type Order,
  type OrderStage,
} from "@rapidual/shared";
import { OC_ROUTES } from "@/mock/routes";
import { pointAlongPath } from "@/components/map/geo";
import { supabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tracks an order. Prefers a **live** driver position broadcast by the driver
 * app over the route channel; falls back to a local simulation so the map is
 * alive even when no driver is online. Also subscribes to order stage changes.
 */
export function useTrackedOrder(initial: Order) {
  const [order, setOrder] = useState<Order>(initial);
  const [t, setT] = useState(0.18);
  const [live, setLive] = useState<DriverLocationPayload | null>(null);

  const route = OC_ROUTES.find((r) => r.id === order.routeId);
  const path = useMemo(() => route?.path ?? [], [route]);

  // Local driver-motion simulation (fallback).
  useEffect(() => {
    const id = setInterval(() => {
      setT((prev) => (prev >= 0.97 ? 0.97 : Number((prev + 0.015).toFixed(3))));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  // Live driver location over the route broadcast channel.
  useEffect(() => {
    if (!order.routeId) return;
    const ch: RealtimeChannel = supabase
      .channel(driverChannel(order.routeId), { config: { broadcast: { self: false } } })
      .on("broadcast", { event: DRIVER_LOCATION_EVENT }, ({ payload }) => {
        setLive(payload as DriverLocationPayload);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [order.routeId]);

  // Realtime stage updates (persisted orders only).
  useEffect(() => {
    if (!UUID.test(order.id)) return;
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => {
          const next = payload.new as { stage: OrderStage; updated_at: string };
          setOrder((o) => ({ ...o, stage: next.stage, updatedAt: next.updated_at }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const isLive = live !== null;
  const driver = isLive ? { lat: live.lat, lng: live.lng } : pointAlongPath(path, t);
  const destination = path[path.length - 1] ?? driver;
  const etaMinutes = isLive ? live.etaMinutes : Math.max(0, Math.round((1 - t) * 26));

  const addPhoto = (photo: CustodyPhoto) =>
    setOrder((o) => ({ ...o, photos: [...o.photos, photo] }));

  return { order, path, driver, destination, etaMinutes, isLive, addPhoto };
}
