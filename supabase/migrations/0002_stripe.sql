-- Stripe linkage for billing edge functions.
alter table profiles add column if not exists stripe_customer_id text;
create index if not exists profiles_stripe_customer_idx on profiles (stripe_customer_id);

-- One active subscription row per user (lets the webhook upsert by user_id).
create unique index if not exists subscriptions_user_unique on subscriptions (user_id);
