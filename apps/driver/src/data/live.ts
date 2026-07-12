/**
 * Driver-side live data. Same contract as the consumer layer: reads return
 * `null` offline so the mock manifest keeps the app fully demoable.
 * Requires the signed-in profile to have `is_driver = true` (RLS policies).
 */
import type { DriverManifest, ManifestStop, OrderStage } from "@rapidual/shared";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";
import { WASHHQ, MOCK_MANIFEST } from "@/mock/manifest";

async function live(): Promise<boolean> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return false;
  try { return !!(await supabase.auth.getSession()).data.session; } catch { return false; }
}

const PICKUP_STAGES: OrderStage[] = ["scheduled", "driver_enroute_pickup"];
const DELIVER_STAGES: OrderStage[] = ["driver_enroute_delivery"];

/** Today's stops: laundry pickups/re-deliveries + paid retail parcels. */
export async function fetchLiveManifest(): Promise<DriverManifest | null> {
  if (!(await live())) return null;
  const today = new Date().toISOString().slice(0, 10);

  const [laundry, retail] = await Promise.all([
    supabase.from("orders")
      .select("id, stage, bag_count, scheduled_for, addresses(line1, lat, lng), profiles:user_id(full_name)")
      .gte("scheduled_for", `${today}T00:00:00Z`).lte("scheduled_for", `${today}T23:59:59Z`),
    supabase.from("retail_orders")
      .select("id, status, user_id, retail_order_items(qty, retailer_id)")
      .in("status", ["paid", "out_for_delivery"]),
  ]);
  if (laundry.error && retail.error) return null;

  const stops: ManifestStop[] = [];
  let seq = 1;

  for (const o of laundry.data ?? []) {
    const stage = o.stage as OrderStage;
    const kind = PICKUP_STAGES.includes(stage) ? "pickup" : DELIVER_STAGES.includes(stage) ? "redeliver" : null;
    if (!kind) continue; // in-facility stages aren't on the truck
    const addr = (Array.isArray(o.addresses) ? o.addresses[0] : o.addresses) as { line1: string; lat: number; lng: number } | null;
    const prof = (Array.isArray(o.profiles) ? o.profiles[0] : o.profiles) as { full_name: string | null } | null;
    if (!addr) continue;
    stops.push({
      id: `l-${o.id}`, seq: seq++, kind,
      customerName: prof?.full_name ?? "Customer",
      address: addr.line1, lat: addr.lat, lng: addr.lng,
      status: "upcoming", bagCount: o.bag_count as number,
      orderId: o.id as string, stage,
    });
  }

  // Retail parcels deliver to the customer's first saved address.
  const userIds = [...new Set((retail.data ?? []).map((r) => r.user_id as string))];
  const { data: addrs } = userIds.length
    ? await supabase.from("addresses").select("user_id, line1, lat, lng").in("user_id", userIds)
    : { data: [] as { user_id: string; line1: string; lat: number; lng: number }[] };
  const addrByUser = new Map((addrs ?? []).map((a) => [a.user_id as string, a]));

  for (const r of retail.data ?? []) {
    const a = addrByUser.get(r.user_id as string);
    if (!a) continue;
    const count = ((r.retail_order_items as { qty: number }[] | null) ?? []).reduce((s, i) => s + i.qty, 0);
    stops.push({
      id: `r-${r.id}`, seq: seq++, kind: "parcel",
      customerName: "Marketplace order", partner: "Rapidual Marketplace",
      address: a.line1, lat: a.lat, lng: a.lng,
      status: "upcoming", parcelCount: Math.max(1, count),
      orderId: r.id as string,
    });
  }

  if (stops.length === 0) return null; // nothing scheduled → keep the demo manifest
  const first = stops[0]!;
  first.status = "active";
  return {
    ...MOCK_MANIFEST,
    routeId: "live",
    routeName: "Today's live route",
    stops,
    utilization: Math.min(0.98, 0.6 + stops.length * 0.04),
  };
}

/** Persist a stage change (laundry) or delivery (retail) after a stop. */
export async function pushStageUpdate(stopId: string, orderId: string, stage: OrderStage): Promise<void> {
  if (!(await live())) return;
  if (stopId.startsWith("r-")) {
    await supabase.from("retail_orders").update({ status: "delivered" }).eq("id", orderId);
  } else {
    await supabase.from("orders").update({ stage, updated_at: new Date().toISOString() }).eq("id", orderId);
  }
}

/** Live dispatch board: real routes + today's order progress per route. */
export async function fetchDispatchRoutes(): Promise<
  { id: string; name: string; done: number; total: number; utilization: number }[] | null
> {
  if (!(await live())) return null;
  const today = new Date().toISOString().slice(0, 10);
  const [routes, orders] = await Promise.all([
    supabase.from("routes").select("id, name, utilization"),
    supabase.from("orders").select("route_id, stage").gte("scheduled_for", `${today}T00:00:00Z`),
  ]);
  if (routes.error || !routes.data?.length) return null;
  const byRoute = new Map<string, { done: number; total: number }>();
  for (const o of orders.data ?? []) {
    const k = (o.route_id as string) ?? "";
    const cur = byRoute.get(k) ?? { done: 0, total: 0 };
    cur.total += 1;
    if (o.stage === "delivered") cur.done += 1;
    byRoute.set(k, cur);
  }
  return routes.data.map((r) => ({
    id: r.id as string, name: r.name as string,
    utilization: Number(r.utilization ?? 0),
    ...(byRoute.get(r.id as string) ?? { done: 0, total: 0 }),
  }));
}
