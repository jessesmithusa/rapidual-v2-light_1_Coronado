# Coronado Architecture — Boundary Plan

> Fork: `jessesmithusa/rapidual-v2-light_1_Coronado` (from `Rapidual/rapidual-v2-light_1`).
> Status: documentation only. No web UI yet (server/domain names undecided). No production changes.

## Roles

**This repo (Rapidual core)** becomes the *operational platform*: drivers, routes,
fulfillment, dispatch, and the partner/franchise API. It is the system of record for
everything that happens after an order is accepted for fulfillment.

**A separate franchise-user system** (future repo: `coronado-wash-integration` /
franchise service) owns the local storefront side: franchise accounts, customer
identities, reservations, customer addresses, and local staff permissions. It is the
system of record for who the customer is and what they asked for.

**CoronadoWash web UI**: deferred until server/domain naming is decided. It will be a
client of the franchise system only — it never talks to Rapidual core directly.

## What this repo already has vs. needs

Already present (keep and build on):
- `packages/logistics-engine` — route matching (`matchRoutes`, `isAddressServed`),
  manifest sequencing (nearest-neighbor + 2-opt in `src/optimize.ts`), capacity/fill
  (`vehicleCapacity`, `slotStatus`, `ROUTE_DAILY_BAG_CAPACITY`), laundry/parcel dual-load.
- `apps/driver` — driver-facing Expo app; dispatch screen is mock data
  (`src/mock/dispatch.ts`), not a real assignment engine.
- `supabase/` — schema (`routes`, `orders.route_id`, `profiles.is_driver` + RLS,
  custody photos, customer↔driver chat) and Deno Edge Functions (Stripe, push).

Missing (Rapidual-side work, in order):
1. **Tenancy**: `orgs` table + `org_id` on `orders`, `addresses`, `routes`; RLS keyed
   on the caller's org claim. Must land before any real Coronado data exists.
2. **Partner API** (`supabase/functions/partner-*`): `POST/GET /partner/v1/orders`,
   webhook registration; token auth scoped `partner:orders:read|write`.
3. **Dispatch**: real driver assignment + order→route insertion (replace the mock;
   time windows and insertion-cost scoring are future extensions of `optimize.ts`).
4. **Webhook dispatcher**: signed (HMAC) events `order.accepted`, `driver.assigned`,
   `pickup.completed`, `out_for_delivery`, `delivered`, `order.failed|canceled`,
   with retry/backoff and a dead-letter table.

## What belongs in the separate franchise repo (not here)

- Franchise/customer auth and profiles (its own Supabase auth or equivalent).
- Reservation lifecycle pre-submission (`draft → reserved → submitted`).
- Submission client (idempotent `POST /partner/v1/orders` with a client ULID as
  `Idempotency-Key` + `external_ref`), webhook receiver (dedupe on `event_id`),
  nightly reconciliation (`GET /partner/v1/orders?updated_since=`).
- Local staff roles, cash-settlement flag (`delivered → settled`), and the future
  CoronadoWash web UI.

## Data ownership

| Data | Owner |
|---|---|
| Customer identity, contact, addresses, reservations | Franchise system |
| Fulfillment orders, driver assignment, routes, custody, live status | Rapidual (this repo) |
| Drivers (all PII) | Rapidual only; franchise sees first name + ETA |
| Payment (future) | Franchise storefront (cash today; `payment_method` on order) |

Each side stores the other's ID plus a cached snapshot — no shared database, no live
foreign keys across the boundary. PII sent to Rapidual is fulfillment-minimum: name,
pickup address, phone, window, bag count, notes.

## API contract (v1 summary)

- Sync command: `POST /partner/v1/orders` → accept/reject + `rapidual_order_id`.
  Idempotent per partner on `Idempotency-Key`.
- Async events: thin webhooks (event id/type/timestamp + order ids); receiver fetches
  full state via `GET /partner/v1/orders/{id}`. HMAC-SHA256 signed (same pattern as
  the existing `stripe-webhook` function).
- Versioning: path (`/partner/v1`), additive-only within a version.
- Spec: OpenAPI file to live at `docs/partner-api/openapi.yaml` (next step).

## Auth & tenant isolation

- Coronado is an **org** in Rapidual with role-scoped API tokens; Postgres RLS
  guarantees a partner token only ever reads/writes its own org's rows. The RLS
  isolation test (org A token cannot see org B rows) is the most important test in
  the suite.
- Franchise-to-Rapidual: bearer token over HTTPS. Rapidual-to-franchise: signed
  webhooks. No shared secrets in client bundles.

## Next steps

1. Author `docs/partner-api/openapi.yaml` + webhook event catalog (contract first).
2. Migration: `orgs` + `org_id` + RLS (backward-compatible; no data backfill needed yet).
3. Scaffold `partner-orders` Edge Function behind the contract tests.
4. Create the `coronado-wash-integration` repo with the reservation model and
   submission/webhook/reconciliation skeleton.
5. Revisit web UI once server/domain names are decided.
