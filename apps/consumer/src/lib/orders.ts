import type { Order, LaundryPreferences, OrderStage } from "@rapidual/shared";
import { pickupQuote } from "@rapidual/utils";
import { supabase } from "./supabase";

export interface NewOrderInput {
  addressId: string;
  routeId: string;
  scheduledFor: string;
  bagCount: number;
  preferences: LaundryPreferences;
}

interface OrderRow {
  id: string;
  user_id: string;
  address_id: string | null;
  route_id: string | null;
  stage: OrderStage;
  bag_count: number;
  per_bag_price: number | null;
  scheduled_for: string;
  preferences: LaundryPreferences;
  created_at: string;
  updated_at: string;
}

const fromRow = (r: OrderRow): Order => ({
  id: r.id,
  userId: r.user_id,
  addressId: r.address_id ?? "",
  routeId: r.route_id ?? "",
  stage: r.stage,
  bagCount: r.bag_count,
  perBagPrice: r.per_bag_price ?? undefined,
  scheduledFor: r.scheduled_for,
  preferences: r.preferences,
  photos: [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Creates a per-bag order. Tries Supabase; falls back to a local order. */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          address_id: input.addressId,
          route_id: input.routeId,
          stage: "scheduled",
          bag_count: input.bagCount,
          per_bag_price: pickupQuote(input.bagCount).effectivePerBag,
          scheduled_for: input.scheduledFor,
          preferences: input.preferences,
        })
        .select()
        .single();
      if (!error && data) return fromRow(data as OrderRow);
    }
  } catch {
    // fall through
  }

  const now = new Date().toISOString();
  return {
    id: `ord_${Math.random().toString(36).slice(2, 8)}`,
    userId: "local",
    addressId: input.addressId,
    routeId: input.routeId,
    stage: "scheduled",
    bagCount: input.bagCount,
    perBagPrice: pickupQuote(input.bagCount).effectivePerBag,
    scheduledFor: input.scheduledFor,
    preferences: input.preferences,
    photos: [],
    createdAt: now,
    updatedAt: now,
  };
}
