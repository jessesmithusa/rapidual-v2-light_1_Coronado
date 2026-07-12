import { stripe, userClient, ensureCustomer } from "../_shared/clients.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

// Ladder per-bag pricing (mirror of @rapidual/utils, Business Plan v4 §07):
// the tier price applies to every bag — 1→$7 · 2→$6.50 · 3→$6 · 4→$5.50 · 5+→$5.
// So 3 bags = $18.00 and 5 bags = $25.00. Rush return is a flat $5 upgrade.
const BASE_CENTS = 700;
const STEP_CENTS = 50;
const FLOOR_CENTS = 500;
const RUSH_CENTS = 500;
const tierCents = (bags: number) => Math.max(FLOOR_CENTS, BASE_CENTS - STEP_CENTS * (bags - 1));
const quoteCents = (bags: number, rush: boolean) => bags * tierCents(bags) + (rush ? RUSH_CENTS : 0);

// Creates a PaymentIntent for a per-bag pickup ($7/bag introductory).
// The app confirms it with PaymentSheet (@stripe/stripe-react-native).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { bags, orderId, rush } = await req.json();
    const wantsRush = rush === true;
    const count = Number(bags);
    if (!Number.isInteger(count) || count < 1) return json({ ok: false, message: "Invalid bag count" }, 400);

    const { data: { user } } = await userClient(req).auth.getUser();
    if (!user) return json({ ok: false, message: "Not authenticated" }, 401);

    const customer = await ensureCustomer(user.id, user.email ?? undefined);
    const intent = await stripe.paymentIntents.create({
      amount: quoteCents(count, wantsRush),
      currency: "usd",
      customer,
      metadata: { kind: "bags", user_id: user.id, bags: String(count), rush: String(wantsRush), order_id: orderId ?? "" },
      automatic_payment_methods: { enabled: true },
    });

    return json({ ok: true, message: `Charging ${count} bag(s) · ${(quoteCents(count, wantsRush) / 100).toFixed(2)} USD`, clientSecret: intent.client_secret });
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : "Error" }, 500);
  }
});
