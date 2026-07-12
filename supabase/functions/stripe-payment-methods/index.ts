import { stripe, userClient, ensureCustomer } from "../_shared/clients.ts";
import { corsHeaders, json } from "../_shared/cors.ts";

// One endpoint, three actions:
//   list   → saved cards for the signed-in user
//   setup  → SetupIntent + ephemeral key for PaymentSheet's "save card" mode
//   detach → remove a saved card
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { action, paymentMethodId } = await req.json();
    const { data: { user } } = await userClient(req).auth.getUser();
    if (!user) return json({ ok: false, message: "Not authenticated" }, 401);
    const customer = await ensureCustomer(user.id, user.email ?? undefined);

    if (action === "list") {
      const methods = await stripe.paymentMethods.list({ customer, type: "card" });
      const cust = await stripe.customers.retrieve(customer) as { invoice_settings?: { default_payment_method?: string | null } };
      const def = cust.invoice_settings?.default_payment_method ?? null;
      return json({
        ok: true,
        cards: methods.data.map((m) => ({
          id: m.id,
          brand: m.card?.brand ?? "card",
          last4: m.card?.last4 ?? "····",
          exp: m.card ? `${String(m.card.exp_month).padStart(2, "0")}/${String(m.card.exp_year).slice(-2)}` : "",
          isDefault: m.id === def,
        })),
      });
    }

    if (action === "setup") {
      const key = await stripe.ephemeralKeys.create({ customer }, { apiVersion: "2024-06-20" });
      const intent = await stripe.setupIntents.create({ customer, automatic_payment_methods: { enabled: true } });
      return json({ ok: true, setupIntent: intent.client_secret, ephemeralKey: key.secret, customer });
    }

    if (action === "detach") {
      if (!paymentMethodId) return json({ ok: false, message: "Missing paymentMethodId" }, 400);
      await stripe.paymentMethods.detach(paymentMethodId);
      return json({ ok: true });
    }

    if (action === "set_default") {
      if (!paymentMethodId) return json({ ok: false, message: "Missing paymentMethodId" }, 400);
      await stripe.customers.update(customer, { invoice_settings: { default_payment_method: paymentMethodId } });
      return json({ ok: true });
    }

    return json({ ok: false, message: "Unknown action" }, 400);
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : "Error" }, 500);
  }
});
