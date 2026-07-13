# Service-to-Service Security Spec (franchise ↔ Rapidual)

Binding requirements for every cross-service call (partner API and webhooks).

## Transport & auth
- HTTPS only. Franchise → Rapidual: bearer token scoped to one org
  (`partner:orders:read|write`). Rapidual → franchise: HMAC-SHA256 signature
  header over the raw body using `PARTNER_WEBHOOK_HMAC_SECRET`; receiver
  verifies with constant-time compare before parsing.

## Input validation
- Every endpoint validates against a strict JSON Schema:
  `additionalProperties: false`, enum allowlists for status/kind fields,
  length caps on all strings, numeric ranges on lat/lng/bags.
- Bounded payloads: reject > 256 KB before parsing (nginx `client_max_body_size`
  + in-handler check). Reject non-`application/json` content types.

## Replay & idempotency
- Requests carry `Idempotency-Key` (client ULID); server stores key → result
  and returns the original response on retry. Webhooks carry `event_id` +
  `occurred_at`; receivers dedupe on `event_id` and reject events older than
  10 minutes (clock-skew tolerant replay window).

## Timeouts & retries
- Client timeouts: 5 s connect / 15 s total. Webhook delivery retries with
  exponential backoff (1m, 5m, 30m, 2h, 6h) then dead-letters with an alert.

## Content handling
- Remote text (customer notes, addresses, chat) is DATA, never instructions:
  no eval/exec, no templating into SQL/shell/HTML without
  parameterization/escaping, never fed to an LLM as directives.

## Secrets & logging
- Secrets live only in `/etc/rapidual/rapidual.env` (root, 0600) or the
  Supabase function environment — never in Git, client bundles, or URLs.
- Logs: no tokens, signatures, or full PII; log key IDs and event IDs only.
  Errors return generic messages; details stay server-side.
