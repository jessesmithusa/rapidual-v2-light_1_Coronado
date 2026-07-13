import http from "node:http";
import { validate, parseBoundedJson, type Schema } from "../../../packages/franchise-core/src/schema";
import { inServiceArea } from "../../../packages/franchise-core/src/geo";
import { isValidKey } from "../../../packages/franchise-core/src/idempotency";
import { claimIdempotencyKey, createReservation, getReservation, healthNumbers, pool, saveIdempotentResponse, type NewReservation } from "./db";
import { NullAdapter } from "./rapidual";

const PORT = Number(process.env.API_PORT ?? 9410);
const MAX_BODY = 262_144;
const adapter = new NullAdapter();

/** Cash laundry pickup, Coronado CA only (ZIP 92118; lat/lng bbox-checked when given). */
const reservationSchema: Schema = {
  required: ["username", "full_name", "address_line1", "zip", "pickup_window_start", "pickup_window_end", "bag_count"],
  fields: {
    username: { kind: "string", minLen: 3, maxLen: 40, pattern: /^[A-Za-z0-9_.-]+$/ },
    full_name: { kind: "string", minLen: 1, maxLen: 120 },
    phone: { kind: "string", maxLen: 32 },
    address_line1: { kind: "string", minLen: 5, maxLen: 200 },
    zip: { kind: "string", maxLen: 5, pattern: /^92118$/ },
    lat: { kind: "number", min: -90, max: 90 },
    lng: { kind: "number", min: -180, max: 180 },
    pickup_window_start: { kind: "string", maxLen: 32, pattern: /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/ },
    pickup_window_end: { kind: "string", maxLen: 32, pattern: /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/ },
    bag_count: { kind: "number", min: 1, max: 20, int: true },
    notes: { kind: "string", maxLen: 500 },
    payment_method: { kind: "enum", values: ["cash"] },
  },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function send(res: http.ServerResponse, status: number, body: unknown) {
  const s = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(s) });
  res.end(s);
  return status;
}

function readBody(req: http.IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        resolve(null);
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
  });
}

async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<number> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;

  if (req.method === "GET" && path === "/health") {
    try {
      await pool.query("select 1");
      const nums = await healthNumbers();
      return send(res, 200, {
        ok: true,
        db: "up",
        rapidual_upstream: adapter.status(),           // 'not_configured' — no fake driver assignment
        handoff: "queued_pending_upstream",
        ...nums,
      });
    } catch {
      return send(res, 503, { ok: false, db: "down" });
    }
  }

  if (req.method === "POST" && path === "/v1/reservations") {
    const key = String(req.headers["idempotency-key"] ?? "");
    if (!isValidKey(key)) return send(res, 400, { error: "missing or invalid Idempotency-Key header" });

    const raw = await readBody(req);
    if (raw === null) return send(res, 413, { error: "payload too large" });
    const parsed = parseBoundedJson(raw, MAX_BODY);
    if (!parsed.ok) return send(res, 400, { error: "invalid JSON", details: parsed.errors });
    const v = validate<NewReservation & { lat?: number; lng?: number }>(parsed.value, reservationSchema);
    if (!v.ok) return send(res, 422, { error: "validation failed", details: v.errors });
    const r = v.value;

    if (Date.parse(r.pickup_window_end) <= Date.parse(r.pickup_window_start)) {
      return send(res, 422, { error: "pickup_window_end must be after pickup_window_start" });
    }
    if ((r.lat !== undefined || r.lng !== undefined) && !inServiceArea(r.lat ?? NaN, r.lng ?? NaN)) {
      return send(res, 422, { error: "coordinates outside Coronado service area" });
    }

    const claim = await claimIdempotencyKey(key, "create-reservation");
    if (claim.seen) {
      if (claim.response) return send(res, 200, claim.response);
      return send(res, 409, { error: "request with this Idempotency-Key is in flight" });
    }
    const created = await createReservation(r);
    await adapter.submit(created.id); // NullAdapter: stays pending, honestly
    const body = { reservation: created, payment_method: "cash", handoff: "pending" };
    await saveIdempotentResponse(key, body);
    return send(res, 201, body);
  }

  const m = path.match(/^\/v1\/reservations\/([0-9a-f-]{36})$/);
  if (req.method === "GET" && m && UUID_RE.test(m[1]!)) {
    const row = await getReservation(m[1]!);
    return row ? send(res, 200, { reservation: row }) : send(res, 404, { error: "not found" });
  }

  return send(res, 404, { error: "not found" });
}

const server = http.createServer(async (req, res) => {
  const t0 = Date.now();
  let status = 500;
  try {
    status = await handle(req, res);
  } catch {
    // never log error objects (may echo request content); generic response only
    if (!res.headersSent) send(res, 500, { error: "internal error" });
  }
  // access log: method/path/status/duration only — no bodies, headers, or secrets
  console.log(`${req.method} ${req.url?.split("?")[0]} ${status} ${Date.now() - t0}ms`);
});

server.listen(PORT, "127.0.0.1", () => console.log(`rapidual-api listening on 127.0.0.1:${PORT}`));
