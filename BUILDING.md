# Building & deploying Rapidual

## Prerequisites
```bash
npm i -g eas-cli supabase
pnpm install
```

## 1. Supabase
```bash
supabase start                 # local stack (Postgres, Auth, Storage, Realtime)
supabase db reset              # apply migrations 0001 + 0002 and seed.sql
# Or link a hosted project:
supabase link --project-ref <ref> && supabase db push

# Deploy the Stripe edge functions + set secrets (see supabase/functions/README.md)
supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_PRICE_STARTER=price_... STRIPE_PRICE_HOUSEHOLD=price_... STRIPE_PRICE_PREMIUM=price_...
supabase functions deploy stripe-subscribe stripe-charge-bag stripe-portal stripe-webhook
```

## 2. App env
```bash
cp .env.example apps/consumer/.env   # fill Supabase + Mapbox + Stripe publishable
cp .env.example apps/driver/.env     # Supabase + Mapbox
```

## 3. Dev build (unlocks Mapbox, Apple sign-in, camera, Stripe PaymentSheet)
```bash
cd apps/consumer
eas init                              # creates the EAS project, writes projectId
# Build secrets used at native build time:
eas secret:create --name MAPBOX_DOWNLOAD_TOKEN --value sk.<your_secret_download_token>
# Public runtime vars (safe to expose) — set per profile or as EAS env:
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co --environment development
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon> --environment development
eas env:create --name EXPO_PUBLIC_MAPBOX_TOKEN --value pk.<public> --environment development

eas build --profile development --platform ios       # or android
# install the build, then:
pnpm consumer                          # Metro serves into the dev build
```

Same steps in `apps/driver` (no Stripe needed there).

## Profiles
- **development** — dev client, internal distribution, iOS simulator allowed.
- **preview** — internal distribution release build (TestFlight/ad-hoc).
- **production** — store build, auto-incrementing build number.

## Expo Go (no build)
`pnpm consumer` / `pnpm driver` run in Expo Go for email auth, the full UI, the
SVG fallback maps, scheduling, subscription, and library photo capture. The dev
build is only needed for the native modules listed above.
