# Edge Functions (Stripe)

| Function | Called by | Purpose |
|---|---|---|
| `stripe-charge-bag` | consumer schedule flow | PaymentIntent for a per-bag pickup ($7/bag introductory) → returns `clientSecret` |

## Required secrets
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
# SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
```

## Deploy
```bash
supabase functions deploy stripe-charge-bag
```

The client `src/lib/payments.ts` calls this and falls back to simulation if it's
absent, so the app works before and after deploy.

> No subscription model: there are no plan/price products to create.
