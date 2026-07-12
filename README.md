# Rapidual — Consumer App (MVP)

The dual-purpose last-mile platform. **Rapid + Dual**: every route runs fully loaded
both directions — subscription laundry anchors dense residential routes, same-day
e-commerce parcels ride the same trucks for 94%+ utilization.

This monorepo contains the **Consumer App** (iOS / Android / Web).

## Pricing model

**Per-bag, no subscription.** Introductory flat rate of **$7 / bag** (wash · dry ·
fold, pickup + re-delivery included). There are no plans, no "included bags", and
no recurring billing — every pickup is charged per bag via Stripe PaymentSheet
(`stripe-charge-bag`). Earlier subscription code (plans, subscription management,
the subscribe/portal/webhook functions) has been removed.


## Stack
- **Expo SDK 56** (React Native 0.85, React 19) — New Architecture, Expo Router (SDK-aligned)
- **Supabase** — Auth, Postgres, Realtime, Storage (chain-of-custody photos)
- **Mapbox GL** (`@rnmapbox/maps`) — maps + live driver tracking *(requires a dev build, not Expo Go)*
- **NativeWind v4** (Tailwind) — premium dark-navy + orange theme
- **Zustand** — client state
- **Stripe** — subscriptions + per-bag payments
- **TypeScript** everywhere, **pnpm** workspaces + **Turborepo**

## Layout
```
apps/consumer            # consumer React Native app (Expo Router)
apps/driver              # driver / ops app (Expo Router) — shares the data model
packages/shared          # domain types shared across both apps + engine
packages/ui              # design-system primitives (Button, Screen, Text…)
packages/utils           # pure helpers (currency, dates, formatting)
packages/logistics-engine# stub for multi-purpose / dual-load routing
supabase/                # config, migrations, seed (subscriptions + OC routes)
backend/                 # reserved for edge functions / server logic
```

## Quick start
```bash
pnpm install
cp .env.example apps/consumer/.env        # fill in keys
pnpm --filter @rapidual/consumer exec expo install --fix   # reconcile to SDK 56
pnpm consumer                              # start Metro
```

> Mapbox and Stripe native modules need a **dev build** (`eas build --profile development`
> or `npx expo run:ios`). Auth, Supabase, and the full UI run in Expo Go.

Run the driver app instead with `pnpm driver`.

### Database
```bash
supabase start          # local stack
supabase db reset       # applies migrations + seed.sql (OC routes & plans)
```

## MVP status

Consumer app, all six deliverables built:

1. ✅ Monorepo + Expo/Supabase config + brand theme + OC seed data
2. ✅ Auth — email + Apple (native) + Google (PKCE), session bootstrap + route guard, onboarding
3. ✅ Home — Mapbox map (auto SVG fallback in Expo Go), nearby-route matching, quick actions, active-sub card
4. ✅ Schedule pickup — 5-step wizard (address → date → bags → preferences → review) writing an order
5. ✅ Tracking — live driver map, 9-stage chain-of-custody timeline, photo capture → Storage, Realtime
6. ✅ Subscription — plan switch, skip/pause/resume/cancel, editable preferences, Stripe interface stub

### Stubbed / needs a backend to go fully live
- **Stripe** (`src/lib/stripe.ts`) — clean interface; wire to Supabase Edge Functions + PaymentSheet.
- **Geocoding** — new addresses use device coords; add a geocoder for real lat/lng.
- **Order/subscription persistence** — writes are best-effort and fall back to local state until the
  DB is connected and addresses are persisted (mock IDs aren't real FKs).
- **Closed-Loop Commerce** — `WardrobeItem` type + seed exist; the wardrobe UI is a future surface.

### Runs in Expo Go vs. dev build
- **Expo Go:** auth (email), all navigation/UI, SVG fallback maps, scheduling, subscription, photo-from-library.
- **Dev build (required for):** live Mapbox maps, Apple sign-in, camera capture, Stripe PaymentSheet.


## Driver app (`apps/driver`)

The ops counterpart, sharing `@rapidual/shared`, `@rapidual/ui`, and the
logistics engine. Screens:

- **Manifest** — the day's route as a single **dual-load** list: laundry pickups,
  re-deliveries, *and* same-day parcels interleaved, with progress + utilization.
- **Stop detail** — action, the customer's wash preferences, navigate (deep-links
  to Maps), chain-of-custody **capture**, and a confirm that **advances the order's
  stage**.

The link between the apps: when a driver confirms a stop, `completeStop()` calls
`advanceOrderStage()` and `uploadCustody()` against the same `orders` /
`custody-photos` tables the consumer's tracking screen subscribes to via Realtime.
One record, two ends. Stage transitions and uploads are best-effort and degrade to
local simulation until the DB is connected.

## Live driver location (Realtime broadcast)

The driver app publishes its position to a per-route **broadcast** channel
(`route:{routeId}`); the consumer's tracking screen subscribes and moves the van
marker live, showing a "Live GPS" badge + live ETA. Contract lives in
`@rapidual/shared` (`driverChannel`, `DRIVER_LOCATION_EVENT`,
`DriverLocationPayload`). With no driver online, the consumer falls back to the
local motion simulation automatically.

## Closed-Loop Commerce (wardrobe)

`apps/consumer` — a wardrobe surface (`app/wardrobe.tsx` + a Home teaser) that
ranks recommendations against the member's wash profile (`rankForProfile`) and
frames them as riding the **same route** as their next laundry delivery. Reads
`wardrobe_items` from Supabase with a mock fallback. "Add to next delivery" is a
stub pending the commerce/Stripe wiring.

## Tests & CI

Vitest covers the pure packages (the dual-load optimizer, utils, route matching).

```bash
pnpm test          # vitest run  → 17 tests
```

`.github/workflows/ci.yml` runs typecheck + lint + tests on every push/PR.

## Live driver location tracking

`apps/driver/src/lib/location.ts` provides a foreground `useDriverPosition()`
(GPS for the map marker) plus a **background task** (`expo-task-manager` +
`expo-location`) that keeps broadcasting the van's position while the app is
backgrounded. The manifest has a "Go live · share location" toggle. Requires a
dev build (background location + foreground service).

## Payments (PaymentSheet + Checkout)

- Extra-bag charges (`src/lib/payments.ts`) fetch a PaymentIntent from the
  `stripe-charge-bag` edge function and present **PaymentSheet**; the schedule
  flow blocks order creation on a successful charge.
- Plan changes / billing open the Stripe **Checkout** / **Billing Portal** URLs
  returned by the edge functions (`src/lib/stripe.ts`).
- `StripeProvider` is mounted via `StripeGate`, which no-ops in Expo Go so the
  app still boots; everything simulates without a backend.

## App smoke tests (Jest + RNTL)

`apps/consumer` has React Native Testing Library smoke tests (UI primitives + the Welcome screen) under `__tests__/`, with native + Supabase
modules mocked in `jest.setup.js`.

```bash
pnpm --filter @rapidual/consumer test
```

These need the full Expo/RN toolchain installed (they don't run in the
package-only Vitest pass).


## Features ported from the original Rapidual app

Brought the original prototype's feature set into this codebase:

- **Retail Marketplace** (`(tabs)/marketplace`) — "shop multiple stores without multiple apps": search, category chips, featured deals, retailer cards with ratings/ETA/min-order, and link/unlink retail accounts.
- **Activity** (`(tabs)/activity`) — orders across In Progress / Upcoming / Completed, mixing laundry + retail; laundry orders deep-link to tracking (in progress) or rating (completed).
- **Rapid Points loyalty** (`rewards`) — points balance, tier ladder (Bronze→Platinum) with progress to next, "How to Earn Points", and a redeemable rewards catalog (state in `store/loyalty.ts`).
- **Refer Friends** (`refer`) — referral code with copy + native Share, friends-referred / points-earned stats, and how-it-works.
- **In-app Chat** (`chat`) — driver/support thread with quick-reply chips and simulated canned responses.
- **Ratings** (`rate/[id]`) — rate driver + experience with optional comments, "Submit Rating & Earn 50 Points" (credits the loyalty store).
- **Promo codes** — applied on the schedule review step (try `WELCOME15`, `RAPID15`, `FREEDEL`), plus a "you'll earn ~N Rapid Points" line; orders credit points on confirm.

Tab bar is now **Home · Shop · Activity · Profile**; Schedule and Track are pushed flows. Like the original (a Bolt prototype), these screens run on mock/local state and integrate with the live pieces already built (Supabase, Mapbox, Stripe, the optimizer).
