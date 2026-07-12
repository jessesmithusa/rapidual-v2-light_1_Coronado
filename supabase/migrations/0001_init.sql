-- Rapidual — initial schema. Mirrors @rapidual/shared domain types.
-- All user-owned tables are protected by row-level security.

-- ── Enums ──────────────────────────────────────────────────
create type plan_tier   as enum ('starter', 'household', 'premium');
create type sub_status  as enum ('active', 'paused', 'canceled', 'trialing');
create type route_load  as enum ('laundry', 'parcel', 'dual');
create type order_stage as enum (
  'scheduled','driver_enroute_pickup','picked_up','at_washhq','washing',
  'folding','quality_check','driver_enroute_delivery','delivered'
);

-- ── Profiles (1:1 with auth.users) ─────────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Plans (public catalog) ─────────────────────────────────
create table plans (
  tier            plan_tier primary key,
  name            text not null,
  price           numeric(8,2) not null,
  bags_per_week   int not null,
  features        text[] not null default '{}',
  stripe_price_id text
);

-- ── Routes (the "dual" core, public read) ──────────────────
create table routes (
  id                 text primary key,
  name               text not null,
  city               text not null,
  service_day        int not null check (service_day between 0 and 6),
  load_type          route_load not null default 'dual',
  utilization        numeric(4,3) not null default 0.0,
  active_subscribers int not null default 0,
  parcel_stops       int not null default 0,
  path               jsonb not null default '[]'
);

-- ── Addresses ──────────────────────────────────────────────
create table addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  label      text not null default 'Home',
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  zip        text not null,
  lat        double precision not null,
  lng        double precision not null,
  route_id   text references routes,
  created_at timestamptz not null default now()
);

-- ── Subscriptions ──────────────────────────────────────────
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users on delete cascade,
  plan                   plan_tier not null,
  status                 sub_status not null default 'active',
  pickup_day             int not null check (pickup_day between 0 and 6),
  preferences            jsonb not null default '{}',
  next_pickup_at         timestamptz,
  skipped_weeks          date[] not null default '{}',
  stripe_subscription_id text,
  created_at             timestamptz not null default now()
);

-- ── Orders + chain of custody ──────────────────────────────
create table orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  subscription_id uuid references subscriptions on delete set null,
  address_id      uuid references addresses on delete set null,
  route_id        text references routes,
  stage           order_stage not null default 'scheduled',
  bag_count       int not null default 1,
  per_bag_price   numeric(8,2),
  scheduled_for   timestamptz not null,
  preferences     jsonb not null default '{}',
  driver          jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table custody_photos (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders on delete cascade,
  stage        order_stage not null,
  storage_path text not null,
  captured_by  text not null default 'driver',
  captured_at  timestamptz not null default now()
);

-- ── Wardrobe (Closed-Loop Commerce placeholder, public read) ─
create table wardrobe_items (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  reason     text not null,
  category   text not null,
  image_url  text,
  partner    text,
  price_from numeric(8,2)
);

-- ── Realtime ───────────────────────────────────────────────
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table custody_photos;

-- ── Storage bucket for custody photos ──────────────────────
insert into storage.buckets (id, name, public) values ('custody-photos','custody-photos', false);

-- ── Row-level security ─────────────────────────────────────
alter table profiles       enable row level security;
alter table addresses      enable row level security;
alter table subscriptions  enable row level security;
alter table orders         enable row level security;
alter table custody_photos enable row level security;
alter table plans          enable row level security;
alter table routes         enable row level security;
alter table wardrobe_items enable row level security;

-- Owner-scoped policies
create policy "own profile"        on profiles      for all using (auth.uid() = id)        with check (auth.uid() = id);
create policy "own addresses"      on addresses     for all using (auth.uid() = user_id)   with check (auth.uid() = user_id);
create policy "own subscriptions"  on subscriptions for all using (auth.uid() = user_id)   with check (auth.uid() = user_id);
create policy "own orders"         on orders        for all using (auth.uid() = user_id)   with check (auth.uid() = user_id);
create policy "own custody photos" on custody_photos for all
  using (exists (select 1 from orders o where o.id = custody_photos.order_id and o.user_id = auth.uid()))
  with check (exists (select 1 from orders o where o.id = custody_photos.order_id and o.user_id = auth.uid()));

-- Public catalogs: any authenticated user can read
create policy "read plans"    on plans          for select to authenticated using (true);
create policy "read routes"   on routes         for select to authenticated using (true);
create policy "read wardrobe" on wardrobe_items for select to authenticated using (true);

-- Storage: users read/write only photos under their own order folder
create policy "own custody files read" on storage.objects for select to authenticated
  using (bucket_id = 'custody-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own custody files write" on storage.objects for insert to authenticated
  with check (bucket_id = 'custody-photos' and (storage.foldername(name))[1] = auth.uid()::text);
