-- Rapidual handoff queue: reservations awaiting submission to the upstream
-- Rapidual API. No real upstream exists yet, so rows stay 'pending' and the
-- API reports that honestly instead of pretending driver assignment works.
create table if not exists handoff_queue (
  reservation_id uuid primary key references reservations on delete cascade,
  state          text not null default 'pending' check (state in ('pending','submitted','failed')),
  attempts       int not null default 0,
  last_error     text check (length(last_error) <= 500),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
