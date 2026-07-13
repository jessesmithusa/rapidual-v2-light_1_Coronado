/** Operational reads/writes backed by local Postgres (Supabase replaced for
 * this layer only). Regions and readiness are data-driven — no region code
 * branches. */
import { pool } from "./db";
import type { Operator } from "./auth";

export async function listRegions() {
  const q = await pool.query(
    `select slug, name, min_lat, max_lat, min_lng, max_lng, active
     from regions order by active desc, slug`,
  );
  return q.rows;
}

export async function latestLocation(operatorId: string) {
  const q = await pool.query(
    `select lat, lng, accuracy_m, recorded_at, received_at
     from operator_locations where operator_id = $1
     order by received_at desc limit 1`,
    [operatorId],
  );
  return q.rows[0] ?? null;
}

/** Append-only insert (table trigger rejects update/delete). */
export async function appendLocation(op: Operator, lat: number, lng: number, accuracyM: number, recordedAt: string) {
  await pool.query(
    `insert into operator_locations (operator_id, lat, lng, accuracy_m, recorded_at)
     values ($1,$2,$3,$4,$5)`,
    [op.id, lat, lng, accuracyM, recordedAt],
  );
}

/** Delivery-assignment readiness: pending work vs. operators with a fresh
 * location fix (15 min), per region. Honest signal — no fake assignment. */
export async function assignmentReadiness() {
  const q = await pool.query(
    `select r.slug as region,
            (select count(*)::int from handoff_queue h
              join reservations res on res.id = h.reservation_id
              where h.state = 'pending') as pending_handoffs,
            count(distinct o.id) filter (where loc.fresh)::int as operators_with_fresh_location,
            count(distinct o.id)::int as active_operators
     from regions r
     left join operators o on o.region_id = r.id and o.status = 'active'
     left join lateral (
       select received_at > now() - interval '15 minutes' as fresh
       from operator_locations ol where ol.operator_id = o.id
       order by received_at desc limit 1
     ) loc on true
     where r.active
     group by r.slug`,
  );
  return {
    regions: q.rows,
    assignment_capable: false, // no Rapidual upstream/dispatch engine wired yet
    note: "readiness data only; driver assignment not implemented",
  };
}
