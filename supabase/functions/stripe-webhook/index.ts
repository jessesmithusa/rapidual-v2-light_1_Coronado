import { stripe, cryptoProvider, adminClient } from "../_shared/clients.ts";

// Stripe → Rapidual source of truth. Orders are only marked paid when Stripe
// says so — never trust the client. Configure the endpoint in the Stripe
// dashboard and set STRIPE_WEBHOOK_SECRET (see DEPLOY.md §3b).
Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!signature || !secret) return new Response("Missing signature", { status: 400 });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(), signature, secret, undefined, cryptoProvider,
    );
  } catch (e) {
    return new Response(`Signature verification failed: ${e instanceof Error ? e.message : e}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as { id: string; metadata: Record<string, string> };
    const kind = pi.metadata.kind ?? "bags";

    if (kind === "bags" && pi.metadata.order_id) {
      await adminClient.from("orders")
        .update({ paid: true, stripe_payment_intent_id: pi.id })
        .eq("id", pi.metadata.order_id);
    } else if (kind === "cart" && pi.metadata.retail_order_id) {
      await adminClient.from("retail_orders")
        .update({ status: "paid", stripe_payment_intent_id: pi.id })
        .eq("id", pi.metadata.retail_order_id);
    } else if (kind === "tip" && pi.metadata.order_id) {
      await adminClient.from("orders")
        .update({ tip_cents: Number(pi.metadata.tip_cents ?? 0) })
        .eq("id", pi.metadata.order_id);
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
