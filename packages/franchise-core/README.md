# @rapidual/franchise-core

Franchise-side backend foundation (Coronado). Storage-agnostic modules +
local-Postgres migrations. **No server, no UI, no deployment here.**

Boundary: this package owns franchises, customers, addresses, and the
reservation lifecycle. Driver/route/fulfillment data stays in Rapidual core
(Supabase); the only cross-reference is `rapidual_links.rapidual_order_id`.

## Modules
- `schema` — strict allowlist validation (`additionalProperties` rejected,
  bounded strings/numbers, enums), bounded JSON parsing (256 KB default).
  Remote text is data only — never evaluated, templated, or executed.
- `security` — HMAC-SHA256 sign/verify (Web Crypto, constant-time),
  10-minute replay window, hard timeouts.
- `idempotency` — `once()` per `Idempotency-Key`, event dedupe; `Store`
  interface backed by `idempotency_keys`/`processed_events` in production.
- `state` — reservation state machine matching the SQL check constraint.
- `geo` — GeoLite2 paths from env (files stay on the host; never committed
  to Git or copied into images) + Coronado service-area bounds.

## Migrations (LOCAL Postgres 12+, not Supabase)
Apply manually, in order, when a franchise DB is provisioned — never automatic:
`psql "$FRANCHISE_DATABASE_URL" -f migrations/0001_orgs_customers.sql` (…0002, 0003).

## Environment (placeholders live in /etc/rapidual/rapidual.env, root 0600)
| Var | Purpose |
|---|---|
| `FRANCHISE_DATABASE_URL` | local Postgres DSN for these tables |
| `PARTNER_API_SIGNING_SECRET` | bearer/signing secret for calls to Rapidual |
| `PARTNER_WEBHOOK_HMAC_SECRET` | verifies inbound Rapidual webhooks |
| `GEOIP_MMDB_PATH` | default `/var/apps/GeoLite2-City.mmdb` |
| `GEOIP_LOCATIONS_CSV_PATH` | default `/var/apps/GeoLite2-City-Locations-en.csv` |

## Tests
`pnpm test` from the repo root (vitest picks up `packages/**/*.test.ts`).
