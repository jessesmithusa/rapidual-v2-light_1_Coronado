# Live nginx configs (synced from /etc/nginx/sites-available, 2026-07-13)
# All three hosts serve explicit 503s — no upstream processes exist yet.
# TLS: single Let's Encrypt cert "rapidual.gosmithnow.com" covering all three
# names (SAN), auto-renewed by certbot.timer. coronadolaundry = frontend not built.
# Status pages: /var/www/gosmithnow-status; ACME webroot: /var/www/letsencrypt.
