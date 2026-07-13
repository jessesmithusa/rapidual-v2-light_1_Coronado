-- External Rapidual linkage + idempotency + webhook event dedupe/outbox.
create table if not exists rapidual_links (
  reservation_id    uuid primary key references reservations on delete cascade,
  rapidual_order_id text not null unique check (length(rapidual_order_id) <= 64),
  submitted_at      timestamptz not null default now(),
  last_status       text,
  last_synced_at    timestamptz
);

create table if not exists idempotency_keys (
  key          text primary key check (length(key) between 8 and 64),
  scope        text not null check (length(scope) <= 40),   -- e.g. 'submit-order'
  response     jsonb,                                       -- replayed on retry
  created_at   timestamptz not null default now()
);

create table if not exists processed_events (
  event_id    text primary key check (length(event_id) <= 64),
  event_type  text not null check (length(event_type) <= 64),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);
