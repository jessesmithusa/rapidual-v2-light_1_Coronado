# backend/

Reserved for server-side logic that can't live in the client:

- **Supabase Edge Functions** — Stripe webhooks (subscription lifecycle,
  per-bag charges), order-stage transitions, push-notification fan-out.
- **Scheduled jobs** — weekly pickup generation, skip/pause reconciliation.

The Stripe **secret** key and service-role key live here (function env), never
in `apps/consumer`.
