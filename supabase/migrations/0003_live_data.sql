-- Rapidual 0003 — everything the prototype kept in local state, made real.
-- Loyalty ledger, ratings + tips, claims, chat, retail orders, standing
-- pickups, push tokens, notification inbox, referrals, driver role/policies,
-- payment linkage on orders, and a slot-capacity helper.

-- ── Payment linkage on laundry orders (webhook marks these) ──
alter table orders add column if not exists paid boolean not null default false;
alter table orders add column if not exists stripe_payment_intent_id text;
alter table orders add column if not exists tip_cents int not null default 0;

-- ── Driver role ──────────────────────────────────────────────
alter table profiles add column if not exists is_driver boolean not null default false;

create or replace function public.is_driver() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_driver from profiles where id = auth.uid()), false)
$$;

-- ── Loyalty: append-only ledger (balance = sum of deltas) ────
create table loyalty_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  delta      int not null,
  reason     text not null,
  created_at timestamptz not null default now()
);
create index loyalty_ledger_user_idx on loyalty_ledger (user_id, created_at desc);

-- ── Ratings + tips (one per order) ───────────────────────────
create table ratings (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders on delete cascade unique,
  user_id     uuid not null references auth.users on delete cascade,
  driver      int not null check (driver between 1 and 5),
  timeliness  int not null check (timeliness between 1 and 5),
  quality     int not null check (quality between 1 and 5),
  tip_cents   int not null default 0,
  comments    text,
  created_at  timestamptz not null default now()
);

-- ── Claims / report-an-issue ─────────────────────────────────
create table claims (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references orders on delete set null,
  user_id    uuid not null references auth.users on delete cascade,
  issue      text not null,
  details    text,
  photo_path text,
  status     text not null default 'open' check (status in ('open','reviewing','resolved')),
  created_at timestamptz not null default now()
);

-- ── In-app chat (customer ↔ driver, per order) ───────────────
create table chat_messages (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders on delete cascade,
  sender_id  uuid not null references auth.users on delete cascade,
  role       text not null check (role in ('customer','driver')),
  body       text not null,
  created_at timestamptz not null default now()
);
create index chat_messages_order_idx on chat_messages (order_id, created_at);

-- ── Retail marketplace orders (parcels that ride the route) ──
create table retail_orders (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users on delete cascade,
  route_id                 text references routes,
  status                   text not null default 'pending_payment'
                           check (status in ('pending_payment','paid','out_for_delivery','delivered','canceled')),
  subtotal_cents           int not null,
  stripe_payment_intent_id text,
  created_at               timestamptz not null default now()
);
create table retail_order_items (
  id              uuid primary key default gen_random_uuid(),
  retail_order_id uuid not null references retail_orders on delete cascade,
  retailer_id     text not null,
  product_id      text not null,
  name            text not null,
  qty             int not null check (qty > 0),
  unit_price_cents int not null
);
create index retail_orders_user_idx  on retail_orders (user_id, created_at desc);
create index retail_orders_route_idx on retail_orders (route_id, status);

-- ── Standing weekly pickup (one per user) ────────────────────
create table standing_pickups (
  user_id    uuid primary key references auth.users on delete cascade,
  weekday    int not null check (weekday between 0 and 6),
  bags       int not null default 1 check (bags > 0),
  active     boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ── Push tokens + notification inbox ─────────────────────────
create table push_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users on delete cascade,
  platform   text not null check (platform in ('ios','android','web')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on push_tokens (user_id);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  title      text not null,
  body       text not null,
  icon       text not null default 'notifications',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

-- ── Referrals ────────────────────────────────────────────────
create table referrals (
  user_id     uuid primary key references auth.users on delete cascade,
  code        text not null unique,
  referred_by uuid references auth.users on delete set null,
  created_at  timestamptz not null default now()
);

-- ── Slot capacity: bags already committed to a route on a day ─
create or replace function public.committed_bags(p_route text, p_date date)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(bag_count), 0)::int
  from orders
  where route_id = p_route and scheduled_for::date = p_date
$$;

-- ── Realtime ─────────────────────────────────────────────────
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table retail_orders;

-- ── Row-level security ───────────────────────────────────────
alter table loyalty_ledger     enable row level security;
alter table ratings            enable row level security;
alter table claims             enable row level security;
alter table chat_messages      enable row level security;
alter table retail_orders      enable row level security;
alter table retail_order_items enable row level security;
alter table standing_pickups   enable row level security;
alter table push_tokens        enable row level security;
alter table notifications      enable row level security;
alter table referrals          enable row level security;

-- Owner-scoped
create policy "own ledger"     on loyalty_ledger   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own ratings"    on ratings          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own claims"     on claims           for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own standing"   on standing_pickups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tokens"     on push_tokens      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notifs"     on notifications    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own referral"   on referrals        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own retail"     on retail_orders    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own retail items" on retail_order_items for all
  using (exists (select 1 from retail_orders r where r.id = retail_order_id and r.user_id = auth.uid()))
  with check (exists (select 1 from retail_orders r where r.id = retail_order_id and r.user_id = auth.uid()));

-- Chat: either party on the order (customer owns it; drivers are drivers)
create policy "chat read"  on chat_messages for select using (
  exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()) or public.is_driver()
);
create policy "chat write" on chat_messages for insert with check (
  sender_id = auth.uid() and (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()) or public.is_driver()
  )
);

-- Drivers: operational reads + stage updates
create policy "drivers read orders"        on orders        for select using (public.is_driver());
create policy "drivers update stage"       on orders        for update using (public.is_driver()) with check (public.is_driver());
create policy "drivers read addresses"     on addresses     for select using (public.is_driver());
create policy "drivers read retail"        on retail_orders for select using (public.is_driver());
create policy "drivers update retail"      on retail_orders for update using (public.is_driver()) with check (public.is_driver());
create policy "drivers read retail items"  on retail_order_items for select using (public.is_driver());
