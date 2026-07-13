# Pilot operator token — storage & rotation

The pilot bearer token lives ONLY in `/etc/rapidual/rapidual.env`
(`PILOT_OPERATOR_TOKEN=…`, root:root 0600). The database stores its sha256
hex in `operators.token_hash` — never the token. It is never printed,
logged, or committed.

## Rotate
```sh
TOKEN=$(openssl rand -hex 32)
HASH=$(printf '%s' "$TOKEN" | sha256sum | cut -d' ' -f1)
# update the DB hash (dedicated DB only)
psql "$FRANCHISE_DATABASE_URL" \
  -c "update operators set token_hash='$HASH' where username='jsmith_pilot';"
# replace PILOT_OPERATOR_TOKEN in /etc/rapidual/rapidual.env (keep 0600), then:
systemctl restart rapidual-api
```
Old token is invalid the moment the DB hash changes. To revoke without
replacing: `update operators set token_hash = null …`.

Per-operator tokens for real (non-pilot) operators should be issued the same
way — one row, one hash — until a proper credential service exists.
