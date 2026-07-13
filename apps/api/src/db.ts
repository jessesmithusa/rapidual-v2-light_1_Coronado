import { Pool } from "pg";

/** DSN comes from /etc/rapidual/rapidual.env via systemd EnvironmentFile.
 * Never log the URL or any part of it. */
const url = process.env.FRANCHISE_DATABASE_URL;
if (!url) {
  console.error("FRANCHISE_DATABASE_URL is not set");
  process.exit(1);
}
export const pool = new Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 5000, query_timeout: 10_000 });

export interface NewReservation {
  username: string;
  full_name: string;
  phone?: string;
  address_line1: string;
  zip: string;
  lat?: number;
  lng?: number;
  pickup_window_start: string;
  pickup_window_end: string;
  bag_count: number;
  notes?: string;
}

export async function createReservation(r: NewReservation) {
  const c = await pool.connect();
  try {
    await c.query("begin");
    const fr = await c.query(
      `insert into franchises (slug, name) values ('coronado','CoronadoWash')
       on conflict (slug) do update set slug = excluded.slug returning id`,
    );
    const franchiseId = fr.rows[0].id;
    const cu = await c.query(
      `insert into customers (franchise_id, username, full_name, phone)
       values ($1,$2,$3,$4)
       on conflict (franchise_id, username)
       do update set full_name = excluded.full_name, phone = coalesce(excluded.phone, customers.phone)
       returning id`,
      [franchiseId, r.username, r.full_name, r.phone ?? null],
    );
    const customerId = cu.rows[0].id;
    const ad = await c.query(
      `insert into customer_addresses (customer_id, line1, zip, lat, lng)
       values ($1,$2,$3,$4,$5) returning id`,
      [customerId, r.address_line1, r.zip, r.lat ?? null, r.lng ?? null],
    );
    const rs = await c.query(
      `insert into reservations (franchise_id, customer_id, address_id, status,
         pickup_window_start, pickup_window_end, bag_count, notes, payment_method)
       values ($1,$2,$3,'reserved',$4,$5,$6,$7,'cash')
       returning id, status, payment_method, created_at`,
      [franchiseId, customerId, ad.rows[0].id, r.pickup_window_start, r.pickup_window_end, r.bag_count, r.notes ?? null],
    );
    await c.query(`insert into handoff_queue (reservation_id) values ($1)`, [rs.rows[0].id]);
    await c.query("commit");
    return { ...rs.rows[0], handoff: "pending" };
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}

export async function getReservation(id: string) {
  const q = await pool.query(
    `select r.id, r.status, r.payment_method, r.bag_count, r.notes,
            r.pickup_window_start, r.pickup_window_end, r.created_at,
            c.username, a.line1 as address_line1, a.zip,
            h.state as handoff_state, h.attempts as handoff_attempts,
            l.rapidual_order_id
     from reservations r
     join customers c on c.id = r.customer_id
     join customer_addresses a on a.id = r.address_id
     left join handoff_queue h on h.reservation_id = r.id
     left join rapidual_links l on l.reservation_id = r.id
     where r.id = $1`,
    [id],
  );
  return q.rows[0] ?? null;
}

export async function claimIdempotencyKey(key: string, scope: string) {
  const ins = await pool.query(
    `insert into idempotency_keys (key, scope) values ($1,$2)
     on conflict (key) do nothing returning key`,
    [key, scope],
  );
  if (ins.rowCount === 1) return { seen: false as const };
  const prior = await pool.query(`select response from idempotency_keys where key = $1`, [key]);
  return { seen: true as const, response: prior.rows[0]?.response ?? null };
}

export async function saveIdempotentResponse(key: string, response: unknown) {
  await pool.query(`update idempotency_keys set response = $2 where key = $1`, [key, JSON.stringify(response)]);
}

export async function healthNumbers() {
  const pending = await pool.query(`select count(*)::int as n from handoff_queue where state = 'pending'`);
  return { pending_handoffs: pending.rows[0].n };
}
