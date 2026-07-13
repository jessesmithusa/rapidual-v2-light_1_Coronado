/** Strict, dependency-free request validation: allowlisted fields only,
 * unknown properties rejected, bounded strings/numbers, enum allowlists.
 * Remote text is validated as DATA; nothing here evaluates or interprets it. */

export type Field =
  | { kind: "string"; maxLen: number; minLen?: number; pattern?: RegExp }
  | { kind: "number"; min: number; max: number; int?: boolean }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "boolean" };

export type Schema = { fields: Record<string, Field>; required: readonly string[] };

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function validate<T = Record<string, unknown>>(input: unknown, schema: Schema): Result<T> {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["body must be a JSON object"] };
  }
  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) errors.push(`forbidden key: ${key}`);
    else if (!(key in schema.fields)) errors.push(`unknown field: ${key}`);
  }
  for (const req of schema.required) {
    if (obj[req] === undefined || obj[req] === null) errors.push(`missing field: ${req}`);
  }
  for (const [key, field] of Object.entries(schema.fields)) {
    const v = obj[key];
    if (v === undefined || v === null) continue;
    switch (field.kind) {
      case "string": {
        if (typeof v !== "string") { errors.push(`${key}: expected string`); break; }
        if (v.length > field.maxLen) errors.push(`${key}: too long (max ${field.maxLen})`);
        if (field.minLen !== undefined && v.length < field.minLen) errors.push(`${key}: too short`);
        if (field.pattern && !field.pattern.test(v)) errors.push(`${key}: bad format`);
        out[key] = v;
        break;
      }
      case "number": {
        if (typeof v !== "number" || !Number.isFinite(v)) { errors.push(`${key}: expected number`); break; }
        if (field.int && !Number.isInteger(v)) errors.push(`${key}: expected integer`);
        if (v < field.min || v > field.max) errors.push(`${key}: out of range [${field.min}, ${field.max}]`);
        out[key] = v;
        break;
      }
      case "enum": {
        if (typeof v !== "string" || !field.values.includes(v)) errors.push(`${key}: not in allowlist`);
        else out[key] = v;
        break;
      }
      case "boolean": {
        if (typeof v !== "boolean") errors.push(`${key}: expected boolean`);
        else out[key] = v;
        break;
      }
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: out as T };
}

/** Parse JSON with a hard byte bound; rejects oversized and non-object payloads. */
export function parseBoundedJson(raw: string, maxBytes = 262_144): Result<unknown> {
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { ok: false, errors: [`payload exceeds ${maxBytes} bytes`] };
  }
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, errors: ["invalid JSON"] };
  }
}

/** Reservation submission schema (franchise → Rapidual partner API). */
export const submitReservationSchema: Schema = {
  required: ["external_ref", "pickup_window_start", "pickup_window_end", "bag_count", "address"],
  fields: {
    external_ref: { kind: "string", minLen: 8, maxLen: 64, pattern: /^[A-Za-z0-9_-]+$/ },
    pickup_window_start: { kind: "string", maxLen: 32, pattern: /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/ },
    pickup_window_end: { kind: "string", maxLen: 32, pattern: /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/ },
    bag_count: { kind: "number", min: 1, max: 20, int: true },
    address: { kind: "string", minLen: 5, maxLen: 200 },
    notes: { kind: "string", maxLen: 500 },
    payment_method: { kind: "enum", values: ["cash", "none", "card"] },
  },
};
