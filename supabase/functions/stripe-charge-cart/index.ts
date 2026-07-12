import { stripe, userClient, ensureCustomer, adminClient } from "../_shared/clients.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

interface CartLine { productId: string; retailerId: string; name: string; qty: number; unitPriceCents: number }

// Creates the retail order server-side (pending_payment) with its line items,
// then a PaymentIntent for the server-computed subtotal. The webhook flips it
// to 'paid'. Prices are recomputed here, never trusted from the client alone.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { items, routeId } = (await req.json()) as { items: CartLine[]; routeId?: string };
    if (!Array.isArray(items) || items.length === 0) return json({ ok: false, message: "Empty cart" }, 400);
    for (const l of items) {
      if (!Number.isInteger(l.qty) || l.qty < 1 || !Number.isInteger(l.unitPriceCents) || l.unitPriceCents < 0)
        return json({ ok: false, message: "Invalid line item" }, 400);
    }
    const subtotal = items.reduce((s, l) => s + l.unitPriceCents * l.qty, 0);
    if (subtotal < 50) return json({ ok: false, message: "Order minimum is $0.50" }, 400);

    const { data: { user } } = await userClient(req).auth.getUser();
    if (!user) return json({ ok: false, message: "Not authenticated" }, 401);

    const { data: order, error } = await adminClient
      .from("retail_orders")
      .insert({ user_id: user.id, route_id: routeId ?? null, subtotal_cents: subtotal })
      .select("id").single();
    if (error || !order) return json({ ok: false, message: error?.message ?? "Order create failed" }, 500);

    await adminClient.from("retail_order_items").insert(
      items.map((l) => ({
        retail_order_id: order.id, retailer_id: l.retailerId, product_id: l.productId,
        name: l.name, qty: l.qty, unit_price_cents: l.unitPriceCents,
      })),
    );

    const customer = await ensureCustomer(user.id, user.email ?? undefined);
    const intent = await stripe.paymentIntents.create({
      amount: subtotal,
      currency: "usd",
      customer,
      metadata: { kind: "cart", user_id: user.id, retail_order_id: order.id },
      automatic_payment_methods: { enabled: true },
    });

    return json({ ok: true, retailOrderId: order.id, clientSecret: intent.client_secret });
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : "Error" }, 500);
  }
});
