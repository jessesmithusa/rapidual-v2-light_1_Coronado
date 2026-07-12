import Constants, { ExecutionEnvironment } from "expo-constants";
import { supabase } from "./supabase";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export interface PayResult {
  ok: boolean;
  message: string;
}

/**
 * Charges for extra bags via Stripe PaymentSheet. Gets a PaymentIntent
 * clientSecret from the `stripe-charge-bag` edge function, then presents the
 * native sheet. Falls back to a simulated success in Expo Go or without a
 * backend, so the schedule flow always completes.
 */
export async function presentBagPayment(bags: number, orderId?: string, rush?: boolean): Promise<PayResult> {
  if (bags < 1) return { ok: true, message: "No extra charge." };

  let clientSecret: string | null = null;
  try {
    const { data, error } = await supabase.functions.invoke("stripe-charge-bag", { body: { bags, orderId, rush: rush === true } });
    if (!error) clientSecret = (data as { clientSecret?: string })?.clientSecret ?? null;
  } catch {
    // no backend yet
  }

  if (isExpoGo || !clientSecret) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true, message: "Charge simulated (PaymentSheet needs a dev build + Stripe)." };
  }

  try {
    // Lazy require — the native module isn't present in Expo Go.
    const Stripe = require("@stripe/stripe-react-native");
    const init = await Stripe.initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: "Rapidual",
    });
    if (init.error) return { ok: false, message: init.error.message };
    const res = await Stripe.presentPaymentSheet();
    if (res.error) return { ok: false, message: res.error.message };
    return { ok: true, message: "Payment complete." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Payment failed." };
  }
}

// ── Cart checkout (retail order rides the laundry route) ──────
export interface CartChargeLine {
  productId: string; retailerId: string; name: string; qty: number; unitPriceCents: number;
}

/** Server creates the retail order + PaymentIntent; webhook marks it paid. */
export async function presentCartPayment(items: CartChargeLine[]): Promise<PayResult & { retailOrderId?: string }> {
  let clientSecret: string | null = null;
  let retailOrderId: string | undefined;
  try {
    const { data, error } = await supabase.functions.invoke("stripe-charge-cart", { body: { items } });
    if (!error) {
      clientSecret = (data as { clientSecret?: string })?.clientSecret ?? null;
      retailOrderId = (data as { retailOrderId?: string })?.retailOrderId;
    }
  } catch { /* no backend yet */ }

  if (isExpoGo || !clientSecret) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true, message: "Checkout simulated (needs a dev build + Stripe).", retailOrderId };
  }
  try {
    const Stripe = require("@stripe/stripe-react-native");
    const init = await Stripe.initPaymentSheet({ paymentIntentClientSecret: clientSecret, merchantDisplayName: "Rapidual" });
    if (init.error) return { ok: false, message: init.error.message };
    const res = await Stripe.presentPaymentSheet();
    if (res.error) return { ok: false, message: res.error.message };
    return { ok: true, message: "Payment complete.", retailOrderId };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Payment failed." };
  }
}

// ── Tip after delivery ─────────────────────────────────────────
export async function presentTipPayment(orderId: string, tipCents: number): Promise<PayResult> {
  if (tipCents < 50) return { ok: true, message: "No tip." };
  let clientSecret: string | null = null;
  try {
    const { data, error } = await supabase.functions.invoke("stripe-charge-tip", { body: { orderId, tipCents } });
    if (!error) clientSecret = (data as { clientSecret?: string })?.clientSecret ?? null;
  } catch { /* no backend yet */ }

  if (isExpoGo || !clientSecret) {
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true, message: "Tip simulated (needs a dev build + Stripe)." };
  }
  try {
    const Stripe = require("@stripe/stripe-react-native");
    const init = await Stripe.initPaymentSheet({ paymentIntentClientSecret: clientSecret, merchantDisplayName: "Rapidual" });
    if (init.error) return { ok: false, message: init.error.message };
    const res = await Stripe.presentPaymentSheet();
    if (res.error) return { ok: false, message: res.error.message };
    return { ok: true, message: "Tip sent — 100% goes to your driver." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Tip failed." };
  }
}

// ── Saved cards (Stripe is the source of truth) ────────────────
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

/** Opens PaymentSheet in setup mode so the user can save a card securely. */
export async function presentAddCard(): Promise<PayResult> {
  let params: { setupIntent?: string; ephemeralKey?: string; customer?: string } | null = null;
  try {
    const { data, error } = await supabase.functions.invoke("stripe-payment-methods", { body: { action: "setup" } });
    if (!error) params = data as typeof params;
  } catch { /* no backend yet */ }

  if (isExpoGo || !params?.setupIntent) {
    await new Promise((r) => setTimeout(r, 300));
    return { ok: false, message: "Adding cards needs a dev build + Stripe backend." };
  }
  try {
    const Stripe = require("@stripe/stripe-react-native");
    const init = await Stripe.initPaymentSheet({
      setupIntentClientSecret: params.setupIntent,
      customerId: params.customer,
      customerEphemeralKeySecret: params.ephemeralKey,
      merchantDisplayName: "Rapidual",
    });
    if (init.error) return { ok: false, message: init.error.message };
    const res = await Stripe.presentPaymentSheet();
    if (res.error) return { ok: false, message: res.error.message };
    return { ok: true, message: "Card saved." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not save card." };
  }
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
