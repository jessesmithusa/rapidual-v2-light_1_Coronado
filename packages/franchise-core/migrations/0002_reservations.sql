-- Reservations/orders: franchise-owned lifecycle. Fulfillment (drivers/routes)
-- stays in Rapidual core; this side stores only the external link (0003).
create table if not exists reservations (
  id             uuid primary key default gen_random_uuid(),
  franchise_id   uuid not null references franchises on delete restrict,
  customer_id    uuid not null references customers on delete restrict,
  address_id     uuid not null references customer_addresses on delete restrict,
  status         text not null default 'draft' check (status in
    ('draft','reserved','submitted','accepted','driver_assigned','picked_up',
     'processing','out_for_delivery','delivered','settled','canceled','failed')),
  pickup_window_start timestamptz not null,
  pickup_window_end   timestamptz not null check (pickup_window_end > pickup_window_start),
  bag_count      int not null check (bag_count between 1 and 20),
  notes          text check (length(notes) <= 500),   -- data only; never executed
  payment_method text not null default 'cash' check (payment_method in ('cash','none','card')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists reservations_status_idx on reservations (franchise_id, status);
