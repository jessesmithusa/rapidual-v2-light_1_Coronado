#!/usr/bin/env bash
# Link Supabase, apply migrations, set the Stripe secret, deploy the charge function.
# Runs against YOUR project — refuses to run if a prerequisite or key is missing.
set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1 || { echo "✗ '$1' not found. Install it first (see DEPLOY.md §0)."; exit 1; }; }
req()  { [ -n "${!1:-}" ] || { echo "✗ env var $1 is required. e.g. $1=... ./scripts/setup-backend.sh"; exit 1; }; }

need supabase
req  SUPABASE_PROJECT_REF
req  STRIPE_SECRET_KEY

echo "→ Linking project $SUPABASE_PROJECT_REF"
supabase link --project-ref "$SUPABASE_PROJECT_REF"

echo "→ Applying migrations (0001_init, 0002_stripe)"
supabase db push

echo "→ Setting Stripe secret (SUPABASE_* keys are injected automatically)"
supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"

echo "→ Deploying edge function: stripe-charge-bag"
supabase functions deploy stripe-charge-bag

echo "✓ Backend ready. The consumer app calls stripe-charge-bag via supabase.functions.invoke."
