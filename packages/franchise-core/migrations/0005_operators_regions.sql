-- Operational backend (local Postgres replaces Supabase for THIS layer only;
-- mobile-app Supabase code is untouched — see docs/SUPABASE_BOUNDARY.md).
-- Regions are data rows: the pilot is Coronado; Palo Alto / Orange County
-- arrive as inserts, never as code branches.

create table if not exists regions (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name     text not null check (length(name) <= 80),
  min_lat  double precision not null,
  max_lat  double precision not null check (max_lat > min_lat),
  min_lng  double precision not null,
  max_lng  double precision not null check (max_lng > min_lng),
  active   boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists operators (
  id         uuid primary key default gen_random_uuid(),
  region_id  uuid not null references regions on delete restrict,
  username   text not null unique check (length(username) between 3 and 40),
  full_name  text not null check (length(full_name) <= 120),
  address    text check (length(address) <= 200),
  email      text check (length(email) <= 254),
  role       text not null default 'driver' check (role in ('driver','runner','dispatcher','admin')),
  status     text not null default 'active' check (status in ('active','suspended')),
  is_pilot   boolean not null default false,      -- clearly-marked pilot/mock accounts
  token_hash char(64),                            -- sha256 hex of bearer token; token itself never stored
  created_at timestamptz not null default now()
);

-- Append-only location history for drivers/runners.
create table if not exists operator_locations (
  id          bigserial primary key,
  operator_id uuid not null references operators on delete cascade,
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  accuracy_m  double precision not null check (accuracy_m between 0 and 10000),
  recorded_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index if not exists operator_locations_op_idx on operator_locations (operator_id, received_at desc);

create or replace function reject_mutation() returns trigger as $$
begin
  raise exception 'operator_locations is append-only';
end $$ language plpgsql;

drop trigger if exists operator_locations_append_only on operator_locations;
create trigger operator_locations_append_only
  before update or delete on operator_locations
  for each row execute function reject_mutation();

-- Email provider CONFIG NAMES ONLY (no credentials, ever) + outbound audit.
create table if not exists email_config (
  id       uuid primary key default gen_random_uuid(),
  purpose  text not null unique check (length(purpose) <= 60),
  provider text not null check (length(provider) <= 60),   -- e.g. 'fastmail', 'maddy-local'
  address  text not null check (length(address) <= 254),
  notes    text check (length(notes) <= 300)
);

create table if not exists email_audit (
  id         bigserial primary key,
  purpose    text not null,
  to_addr    text not null check (length(to_addr) <= 254),
  subject    text not null check (length(subject) <= 200),
  status     text not null default 'not_sent' check (status in ('not_sent','queued','sent','failed')),
  created_at timestamptz not null default now()
);
