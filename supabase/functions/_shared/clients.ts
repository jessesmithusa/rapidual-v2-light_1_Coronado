import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

// Deno-compatible Stripe client (fetch transport + SubtleCrypto for webhooks).
export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});
export const cryptoProvider = Stripe.createSubtleCryptoProvider();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

/** A client scoped to the calling user's JWT (respects RLS). */
export function userClient(req: Request) {
  return createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
}

/** Service-role client for privileged writes (bypasses RLS). Use sparingly. */
export const adminClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

/** Returns the Stripe customer id for a user, creating one if needed. */
export async function ensureCustomer(userId: string, email?: string): Promise<string> {
  const { data: prof } = await adminClient
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();
  if (prof?.stripe_customer_id) return prof.stripe_customer_id as string;

  const customer = await stripe.customers.create({ email, metadata: { user_id: userId } });
  await adminClient.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}
