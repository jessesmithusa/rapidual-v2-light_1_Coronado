# Rapidual — Going Live (zero → running on a device)

This is the exact sequence to take Rapidual from source to a real dev build with
Supabase, Stripe, Mapbox, push, QR, and live location all working.

> Every step here runs against **your own** Supabase / Stripe / Mapbox / Expo
> accounts. Nothing in this repo contains secrets — you paste your keys locally.
> The two helper scripts in `scripts/` wrap the commands and refuse to run if a
> prerequisite or key is missing, so you can't half-deploy by accident.

---

## 0. Accounts & tools you'll need

**Accounts (free tiers are fine to start):**
- Supabase project — https://supabase.com
- Stripe account (test mode) — https://dashboard.stripe.com
- Mapbox account — https://account.mapbox.com
- Expo (EAS) account — https://expo.dev
- **Apple Developer ($99/yr)** — only required for an iOS build on a *physical*
  iPhone (push + background location). iOS Simulator and Android device builds
  don't need it.

**Tools:**
```bash
node -v            # ≥ 20
corepack enable && corepack prepare pnpm@9 --activate
npm i -g supabase eas-cli
# For local device runs: Xcode (iOS) and/or Android Studio (Android), Watchman.
```

---

## 1. Install & environment

```bash
pnpm install                       # installs the whole monorepo
cp .env.example apps/consumer/.env # then fill it in (see below)
cp .env.example apps/driver/.env
```

Fill `apps/consumer/.env` (driver needs the Mapbox + Supabase values too):

| Variable | Where it comes from |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same page → `anon` `public` key (safe to ship) |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Mapbox → Tokens → a **public** `pk.*` token |
| `MAPBOX_DOWNLOAD_TOKEN` | Mapbox → Tokens → a **secret** `sk.*` token with `Downloads:Read` (build-time only, never bundled) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys → `pk_test_*` |

> The Stripe **secret** key never goes in `.env` — it lives in Supabase (step 3).

---

## 2. Supabase: schema

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>   # ref is in your project URL
supabase db push   # applies migrations 0001, 0002, and 0003 (live data)
# optional starter data:
psql "$SUPABASE_DB_URL" -f supabase/seed.sql       # or paste seed.sql in the SQL editor
```

`db push` creates `profiles` (auto-populated on signup via trigger), `plans`,
`routes`, `orders`, the `order_stage` enum, RLS policies, and the Stripe columns.

---

## 3. Stripe: secret + deploy the charge function

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` into Edge Functions automatically — you only set the
Stripe key:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
for f in stripe-charge-bag stripe-charge-cart stripe-charge-tip stripe-payment-methods stripe-webhook send-push delete-account; do
  supabase functions deploy $f
done
```

The app already calls it: `supabase.functions.invoke("stripe-charge-bag", { body: { bags } })`
in `apps/consumer/src/lib/payments.ts`. It returns a PaymentIntent `clientSecret`
priced with the **graduated** model ($7 first bag, −$0.50 each, floored at $4),
which `@stripe/stripe-react-native`'s PaymentSheet confirms.

To iterate locally instead of deploying: `supabase functions serve stripe-charge-bag`
(reads secrets from `supabase/.env`).

---

### 3b. Stripe webhook (makes payment truth server-side)
1. Stripe Dashboard → Developers → Webhooks → *Add endpoint*.
2. URL: `https://<project-ref>.functions.supabase.co/stripe-webhook`
3. Events: `payment_intent.succeeded`.
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` (above) and redeploy the function.
Orders/carts/tips are only marked paid by this webhook — never by the client.

### 3c. Drivers & push
- Mark driver accounts: `update profiles set is_driver = true where id = '<uuid>';`
- Remote push needs APNs/FCM credentials in your Expo project (`eas credentials`); tokens are saved automatically on first launch.
- Trigger pushes from ops tooling or DB webhooks by POSTing to `send-push` with header `x-push-secret: $PUSH_FN_SECRET`.
- Optional crash reporting: set `EXPO_PUBLIC_SENTRY_DSN` and `pnpm add @sentry/react-native` in each app.

## 4. EAS: build a dev client

A dev client is required (not Expo Go) because Mapbox, Stripe, Apple auth,
background location, and notifications are native modules.

```bash
cd apps/consumer
eas init                       # creates the EAS project + writes the real projectId
                               # (replaces the placeholder in app.config.ts → extra.eas)

# make the Mapbox secret token available to the build:
eas env:create --name MAPBOX_DOWNLOAD_TOKEN --value sk.xxx --visibility secret

# build:
eas build --profile development --platform ios       # simulator (per eas.json)
# or, for an installable Android dev build:
eas build --profile development --platform android
```

Then repeat in `apps/driver` (its own `eas init` + build).

> **Push notes:** the in-app pickup reminders are *local* notifications and work
> on any dev build once you grant permission. Server-sent (remote) push also
> needs an APNs key (iOS) / FCM (Android) — run `eas credentials` and wire a
> sender when you want that. The app is configured (`expo-notifications` plugin,
> `POST_NOTIFICATIONS`) and ready for both.

---

## 5. Run it

```bash
# from the app folder, after installing the dev build on your device/simulator:
npx expo start --dev-client
```

Open the dev build and scan the QR (or pick the simulator).

---

## 6. Verify each device-only feature

- **Auth** — sign up with email; a `profiles` row appears in Supabase.
- **Stripe** — schedule a pickup → PaymentSheet opens → test card `4242 4242 4242 4242`, any future date/CVC.
- **Push** — Profile → Notifications → toggle on → grant permission → a weekly pickup reminder is scheduled.
- **QR bag tags** — Track or Activity → Bag tags → real scannable codes render.
- **Live location** — Driver app → manifest → "Go live"; consumer Track shows the moving marker.
- **Maps** — Mapbox tiles render on Home / Track / manifest (SVG fallback only appears if the token is missing).

---

## 7. One-shot helpers

From the repo root, after filling `.env` and exporting the few values each script
asks for:

```bash
SUPABASE_PROJECT_REF=xxxxx STRIPE_SECRET_KEY=sk_test_xxx ./scripts/setup-backend.sh
APP=consumer PLATFORM=ios MAPBOX_DOWNLOAD_TOKEN=sk.xxx ./scripts/build-dev.sh
```

Each script checks its prerequisites and stops with a clear message if something
is missing — so a missing CLI or key fails loudly instead of half-deploying.
