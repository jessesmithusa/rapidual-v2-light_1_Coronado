/** Idempotency + event dedupe. Storage-agnostic: callers supply a Store
 * (Postgres tables from migrations/0003 in production; MemoryStore in tests). */

export interface Store {
  /** Atomically claim a key; returns prior response if the key was seen. */
  claim(key: string, scope: string): Promise<{ seen: boolean; response?: unknown }>;
  saveResponse(key: string, response: unknown): Promise<void>;
  /** True if event_id was already processed (and records it if not). */
  markEvent(eventId: string, eventType: string, occurredAt: string): Promise<boolean>;
}

const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidKey(key: string): boolean {
  return KEY_RE.test(key);
}

/** Run `op` at most once per idempotency key; retries return the saved response. */
export async function once<T>(store: Store, key: string, scope: string, op: () => Promise<T>): Promise<T> {
  if (!isValidKey(key)) throw new Error("invalid idempotency key");
  const prior = await store.claim(key, scope);
  if (prior.seen) return prior.response as T;
  const result = await op();
  await store.saveResponse(key, result);
  return result;
}

/** In-memory Store for tests and single-process use. */
export class MemoryStore implements Store {
  private keys = new Map<string, { scope: string; response?: unknown }>();
  private events = new Set<string>();

  async claim(key: string, scope: string) {
    const hit = this.keys.get(key);
    if (hit) return { seen: true, response: hit.response };
    this.keys.set(key, { scope });
    return { seen: false };
  }
  async saveResponse(key: string, response: unknown) {
    const row = this.keys.get(key);
    if (row) row.response = response;
  }
  async markEvent(eventId: string, _eventType: string, _occurredAt: string) {
    if (this.events.has(eventId)) return true;
    this.events.add(eventId);
    return false;
  }
}
