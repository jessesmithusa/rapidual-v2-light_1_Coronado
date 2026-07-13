import { createHash } from "node:crypto";
import type http from "node:http";
import { pool } from "./db";

export interface Operator {
  id: string;
  region_id: string;
  username: string;
  full_name: string;
  address: string | null;
  email: string | null;
  role: string;
  is_pilot: boolean;
  region_slug: string;
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
}

const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;

/** Bearer auth: sha256(token) looked up against operators.token_hash.
 * The token value is never logged or echoed anywhere. */
export async function authenticate(req: http.IncomingMessage): Promise<Operator | null> {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!TOKEN_RE.test(token)) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  const q = await pool.query(
    `select o.id, o.region_id, o.username, o.full_name, o.address, o.email, o.role, o.is_pilot,
            r.slug as region_slug, r.min_lat, r.max_lat, r.min_lng, r.max_lng
     from operators o join regions r on r.id = o.region_id
     where o.token_hash = $1 and o.status = 'active'`,
    [hash],
  );
  return q.rows[0] ?? null;
}
