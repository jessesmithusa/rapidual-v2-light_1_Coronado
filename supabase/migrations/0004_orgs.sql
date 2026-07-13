-- Franchise/partner tenancy: orgs table + org linkage on orders.
-- Backward-compatible: org_id is nullable; existing consumer-app rows are untouched.
-- (Conventions follow 0001_init.sql: RLS enabled per table, policies per role.)

create table if not exists orgs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,          -- e.g. 'coronado'
  name        text not null,
  status      text not null default 'active' check (status in ('active','suspended')),
  created_at  timestamptz not null default now()
);

alter table orders add column if not exists org_id uuid references orgs on delete restrict;
create index if not exists orders_org_idx on orders (org_id);

alter table orgs enable row level security;

-- No policies yet: with RLS on and no policy, anon/user roles can read/write
-- nothing. Partner-token policies land with the partner API migration.
