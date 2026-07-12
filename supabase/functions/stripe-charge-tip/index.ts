import { stripe, userClient, ensureCustomer } from "../_shared/clients.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

// 100% of tips go to the driver: the PaymentIntent is tagged so payout math
// can attribute it. Amount is capped defensively at $200.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { orderId, tipCents } = await req.json();
    const cents = Number(tipCents);
    if (!orderId || !Number.isInteger(cents) || cents < 50 || cents > 20000)
      return json({ ok: false, message: "Invalid tip" }, 400);

    const supa = userClient(req);
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ ok: false, message: "Not authenticated" }, 401);

    // RLS guarantees the caller owns the order.
    const { data: order } = await supa.from("orders").select("id").eq("id", orderId).single();
    if (!order) return json({ ok: false, message: "Order not found" }, 404);

    const customer = await ensureCustomer(user.id, user.email ?? undefined);
    const intent = await stripe.paymentIntents.create({
      amount: cents,
      currency: "usd",
      customer,
      metadata: { kind: "tip", user_id: user.id, order_id: orderId, tip_cents: String(cents) },
      automatic_payment_methods: { enabled: true },
    });
    return json({ ok: true, clientSecret: intent.client_secret });
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : "Error" }, 500);
  }
});
