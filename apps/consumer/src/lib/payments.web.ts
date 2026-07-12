import { supabase } from "./supabase";

export interface PayResult {
  ok: boolean;
  message: string;
}

export async function presentBagPayment(bags: number, orderId?: string, rush?: boolean): Promise<PayResult> {
  if (bags < 1) return { ok: true, message: "No extra charge." };
  try {
    await supabase.functions.invoke("stripe-charge-bag", { body: { bags, orderId, rush: rush === true } });
  } catch {
    // no backend yet
  }
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true, message: "Charge simulated (PaymentSheet needs a dev build + Stripe)." };
}

export interface CartChargeLine {
  productId: string; retailerId: string; name: string; qty: number; unitPriceCents: number;
}

export async function presentCartPayment(items: CartChargeLine[]): Promise<PayResult & { retailOrderId?: string }> {
  let retailOrderId: string | undefined;
  try {
    const { data, error } = await supabase.functions.invoke("stripe-charge-cart", { body: { items } });
    if (!error) retailOrderId = (data as { retailOrderId?: string })?.retailOrderId;
  } catch {
    // no backend yet
  }
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true, message: "Checkout simulated (needs a dev build + Stripe).", retailOrderId };
}

export async function presentTipPayment(orderId: string, tipCents: number): Promise<PayResult> {
  if (tipCents < 50) return { ok: true, message: "No tip." };
  try {
    await supabase.functions.invoke("stripe-charge-tip", { body: { orderId, tipCents } });
  } catch {
    // no backend yet
  }
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, message: "Tip simulated (needs a dev build + Stripe)." };
}

export interface StripeCard { id: string; brand: string; last4: string; exp: string; isDefault: boolean }

export async function listSavedCards(): Promise<StripeCard[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-payment-methods", { body: { action: "list" } });
    if (error) return null;
    const out = data as { ok: boolean; cards?: StripeCard[] };
    return out.ok ? (out.cards ?? []) : null;
  } catch {
    return null;
  }
}

export async function presentAddCard(): Promise<PayResult> {
  await new Promise((r) => setTimeout(r, 300));
  return { ok: false, message: "Adding cards needs a dev build + Stripe backend." };
}

export async function detachCard(paymentMethodId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-payment-methods", { body: { action: "detach", paymentMethodId } });
    return !error && (data as { ok: boolean })?.ok === true;
  } catch { return false; }
}

export async function setDefaultCard(paymentMethodId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-payment-methods", { body: { action: "set_default", paymentMethodId } });
    return !error && (data as { ok: boolean })?.ok === true;
  } catch { return false; }
}
