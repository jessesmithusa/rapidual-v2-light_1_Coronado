-- Franchise-side schema (LOCAL Postgres 12+, NOT Supabase).
-- Apply manually: psql "$FRANCHISE_DATABASE_URL" -f <file>. Never auto-applied.
create extension if not exists pgcrypto;  -- gen_random_uuid on PG12

create table if not exists franchises (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,                     -- 'coronado'
  name       text not null check (length(name) <= 120),
  status     text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id           uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references franchises on delete restrict,
  username     text not null check (length(username) between 3 and 40),
  full_name    text not null check (length(full_name) <= 120),
  phone        text check (length(phone) <= 32),
  email        text check (length(email) <= 254),
  created_at   timestamptz not null default now(),
  unique (franchise_id, username)
);

create table if not exists customer_addresses (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers on delete cascade,
  line1        text not null check (length(line1) <= 200),
  city         text not null default 'Coronado' check (length(city) <= 80),
  state        text not null default 'CA' check (length(state) = 2),
  zip          text not null check (zip ~ '^[0-9]{5}$'),
  lat          double precision check (lat between -90 and 90),
  lng          double precision check (lng between -180 and 180),
  created_at   timestamptz not null default now()
);
