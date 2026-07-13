# Supabase → local Postgres boundary (honest status)

The **operational backend** (franchise reservations, operators, regions,
location history, handoff queue, readiness reads) now runs on the dedicated
local Postgres database `rapidual_coronado` behind `apps/api`. Supabase is
**not** replaced anywhere else.

## Still on Supabase (untouched, would require real mobile/API work)
- Consumer & driver **mobile apps**: all `@supabase/supabase-js` usage —
  auth/sessions, orders UI, Realtime live tracking, Storage custody photos.
- **Edge Functions**: Stripe charges/webhooks, push notifications,
  account deletion.
- Their schema (`supabase/migrations/`) remains authoritative for the apps.

## Migrating the rest would need (not done, not pretended)
1. Replacement auth (Supabase Auth → tokens/OIDC) + mobile app changes.
2. A Realtime replacement (websocket layer) for live driver tracking.
3. File storage for custody photos + signed URLs.
4. Porting Deno edge functions to the local API (Stripe secrets handling).
5. Data migration for any production Supabase rows.

Until then: mobile apps talk to Supabase; the Coronado pilot API talks to
local Postgres; the two meet only through `handoff_queue`/`rapidual_links`,
and `/health` + `/v1/ops/readiness` state plainly that upstream dispatch is
`not_configured` / `assignment_capable: false`.

## Email
`email_config` holds provider names/addresses only (fastmail →
jesse@gosmithnow.com, maddy-local → rapidual@gosmithnow.com). No SMTP
credentials exist in this repo or database; nothing sends mail yet, and
`email_audit` rows stay `not_sent` until a sender is deliberately wired.
