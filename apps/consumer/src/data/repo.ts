/**
 * Live data layer. Every read returns `null` when the backend isn't reachable
 * or the user isn't signed in — callers fall back to their local/mock state,
 * so the app is fully usable with zero configuration and fully real with it.
 */
import { supabase } from "@/lib/supabase";
import { isLive, currentUserId } from "@/lib/live";
import type { ActivityItem, ActivityStatus } from "@/mock/activity";

// ── Loyalty ────────────────────────────────────────────────
export async function fetchPoints(): Promise<number | null> {
  if (!(await isLive())) return null;
  const { data, error } = await supabase.from("loyalty_ledger").select("delta");
  if (error || !data) return null;
  return data.reduce((s, r) => s + (r.delta as number), 0);
}

export async function recordPoints(delta: number, reason: string): Promise<void> {
  const uid = await currentUserId();
  if (!uid || !(await isLive())) return;
  await supabase.from("loyalty_ledger").insert({ user_id: uid, delta, reason });
}

// ── Activity (laundry orders + retail orders → one feed) ──
const STAGE_TO_STATUS: Record<string, ActivityStatus> = {
  scheduled: "upcoming",
  driver_enroute_pickup: "in_progress", picked_up: "in_progress", at_washhq: "in_progress",
  washing: "in_progress", folding: "in_progress", quality_check: "in_progress",
  driver_enroute_delivery: "in_progress", delivered: "completed",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

export async function fetchActivity(): Promise<ActivityItem[] | null> {
  if (!(await isLive())) return null;
  const [laundry, retail] = await Promise.all([
    supabase.from("orders").select("id, stage, bag_count, per_bag_price, scheduled_for, created_at")
      .order("created_at", { ascending: false }).limit(30),
    supabase.from("retail_orders").select("id, status, subtotal_cents, created_at, retail_order_items(qty)")
      .order("created_at", { ascending: false }).limit(30),
  ]);
  if (laundry.error && retail.error) return null;

  const items: ActivityItem[] = [];
  for (const o of laundry.data ?? []) {
    const status = STAGE_TO_STATUS[o.stage as string] ?? "upcoming";
    const bags = o.bag_count as number;
    items.push({
      id: o.id as string, kind: "laundry", title: "Wash · Dry · Fold",
      subtitle: `${bags} bag${bags === 1 ? "" : "s"} · ${status === "in_progress" ? "In progress" : status === "upcoming" ? "Scheduled" : "Delivered"}`,
      date: fmtDate((o.scheduled_for ?? o.created_at) as string),
      amount: bags * Number(o.per_bag_price ?? 6.5),
      status, icon: "shirt",
    });
  }
  for (const r of retail.data ?? []) {
    const st = r.status as string;
    const status: ActivityStatus = st === "delivered" ? "completed" : st === "out_for_delivery" ? "in_progress" : "upcoming";
    const count = ((r.retail_order_items as { qty: number }[] | null) ?? []).reduce((s, i) => s + i.qty, 0);
    items.push({
      id: r.id as string, kind: "retail", title: "Marketplace order",
      subtitle: `${count} item${count === 1 ? "" : "s"} · ${st.replace(/_/g, " ")}`,
      date: fmtDate(r.created_at as string),
      amount: (r.subtotal_cents as number) / 100,
      status, icon: "basket",
    });
  }
  return items;
}

export async function rescheduleOrder(id: string, isoDate: string): Promise<boolean> {
  if (!(await isLive())) return false;
  const { error } = await supabase.from("orders").update({ scheduled_for: isoDate }).eq("id", id);
  return !error;
}

export async function cancelOrder(id: string): Promise<boolean> {
  if (!(await isLive())) return false;
  const { error } = await supabase.from("orders").delete().eq("id", id).eq("stage", "scheduled");
  return !error;
}

// ── Laundry order creation (wizard) ────────────────────────
export async function createLaundryOrder(input: {
  bagCount: number; perBag: number; scheduledForISO: string; routeId: string | null; addressId: string | null;
  preferences: Record<string, unknown>;
}): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid || !(await isLive())) return null;
  const { data, error } = await supabase.from("orders").insert({
    user_id: uid, bag_count: input.bagCount, per_bag_price: input.perBag,
    scheduled_for: input.scheduledForISO, route_id: input.routeId,
    address_id: input.addressId, preferences: input.preferences,
  }).select("id").single();
  return error ? null : (data.id as string);
}

// ── Ratings + claims ────────────────────────────────────────
export async function submitRating(orderId: string, r: { driver: number; timeliness: number; quality: number; tipCents: number; comments: string }): Promise<void> {
  const uid = await currentUserId();
  if (!uid || !(await isLive())) return;
  const c = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
  await supabase.from("ratings").upsert({
    order_id: orderId, user_id: uid, driver: c(r.driver), timeliness: c(r.timeliness),
    quality: c(r.quality), tip_cents: r.tipCents, comments: r.comments || null,
  }, { onConflict: "order_id" });
}

export async function submitClaim(orderId: string | null, issue: string, details: string, photoPath: string | null): Promise<void> {
  const uid = await currentUserId();
  if (!uid || !(await isLive())) return;
  await supabase.from("claims").insert({ order_id: orderId, user_id: uid, issue, details: details || null, photo_path: photoPath });
}

// ── Standing pickup ─────────────────────────────────────────
export async function fetchStanding(): Promise<{ active: boolean; weekday: number; bags: number } | null> {
  if (!(await isLive())) return null;
  const { data, error } = await supabase.from("standing_pickups").select("active, weekday, bags").maybeSingle();
  if (error || !data) return null;
  return { active: data.active as boolean, weekday: data.weekday as number, bags: data.bags as number };
}

export async function saveStanding(s: { active: boolean; weekday: number; bags: number }): Promise<void> {
  const uid = await currentUserId();
  if (!uid || !(await isLive())) return;
  await supabase.from("standing_pickups").upsert({ user_id: uid, ...s, updated_at: new Date().toISOString() });
}

// ── Notifications inbox + push tokens ───────────────────────
export interface InboxRow { id: string; title: string; body: string; icon: string; read: boolean; created_at: string }

export async function fetchInbox(): Promise<InboxRow[] | null> {
  if (!(await isLive())) return null;
  const { data, error } = await supabase.from("notifications")
    .select("id, title, body, icon, read, created_at")
    .order("created_at", { ascending: false }).limit(50);
  return error ? null : (data as InboxRow[]);
}

export async function markInboxRead(): Promise<void> {
  if (!(await isLive())) return;
  await supabase.from("notifications").update({ read: true }).eq("read", false);
}

export async function savePushToken(token: string, platform: "ios" | "android" | "web"): Promise<void> {
  const uid = await currentUserId();
  if (!uid || !(await isLive())) return;
  await supabase.from("push_tokens").upsert({ token, user_id: uid, platform, updated_at: new Date().toISOString() });
}

// ── History / impact / capacity ─────────────────────────────
export async function fetchPickupHistory(): Promise<{ weekday: number; bags: number }[] | null> {
  if (!(await isLive())) return null;
  const { data, error } = await supabase.from("orders").select("scheduled_for, bag_count")
    .order("scheduled_for", { ascending: false }).limit(24);
  if (error || !data || data.length === 0) return null;
  return data.map((o) => ({ weekday: new Date(o.scheduled_for as string).getDay(), bags: o.bag_count as number }));
}

export async function fetchImpactBags(): Promise<number[] | null> {
  if (!(await isLive())) return null;
  const { data, error } = await supabase.from("orders").select("bag_count").eq("stage", "delivered").limit(200);
  if (error || !data || data.length === 0) return null;
  return data.map((o) => o.bag_count as number);
}

export async function committedBagsFor(routeId: string, isoDate: string): Promise<number | null> {
  if (!(await isLive())) return null;
  const { data, error } = await supabase.rpc("committed_bags", { p_route: routeId, p_date: isoDate.slice(0, 10) });
  return error ? null : (data as number);
}

// ── Account ─────────────────────────────────────────────────
export async function deleteAccount(): Promise<{ ok: boolean; message?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("delete-account", { body: { confirm: "DELETE" } });
    if (error) return { ok: false, message: error.message };
    return (data as { ok: boolean; message?: string }) ?? { ok: false, message: "No response" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed" };
  }
}
