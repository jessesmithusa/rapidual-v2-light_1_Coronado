-- Coronado pilot seed. PILOT/MOCK data, clearly marked; no real credentials.
-- The bearer token is generated at deploy time and only its sha256 hash is
-- written to operators.token_hash (see deploy/docs/PILOT_TOKEN_ROTATION.md).

insert into regions (slug, name, min_lat, max_lat, min_lng, max_lng, active)
values
  ('coronado',      'Coronado, CA',      32.62, 32.705, -117.26, -117.12, true),
  ('palo-alto',     'Palo Alto, CA',     37.38, 37.47,  -122.20, -122.09, false),
  ('orange-county', 'Orange County, CA', 33.38, 33.95,  -118.12, -117.41, false)
on conflict (slug) do nothing;

insert into operators (region_id, username, full_name, address, email, role, is_pilot)
select r.id, 'jsmith_pilot', 'Jesse Smith (PILOT)',
       '850 H Ave, Coronado, CA 92118', 'jesse@gosmithnow.com', 'driver', true
from regions r where r.slug = 'coronado'
on conflict (username) do nothing;

insert into email_config (purpose, provider, address, notes) values
  ('operator-notifications', 'fastmail',    'jesse@gosmithnow.com',    'config name only; credentials never stored here'),
  ('system-sender',          'maddy-local', 'rapidual@gosmithnow.com', 'local Maddy MTA; sending not yet enabled')
on conflict (purpose) do nothing;
