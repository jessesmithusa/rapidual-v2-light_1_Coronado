/** HMAC signing/verification, replay protection, and timeouts.
 * Uses Web Crypto (Node 20+ and Deno) — no node:crypto, no dependencies.
 * Secrets are passed in by the caller (loaded from /etc/rapidual/rapidual.env
 * or the function environment); nothing here reads or logs secret values. */

const enc = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/** hex HMAC-SHA256 over `payload` (raw body string). */
export async function sign(secret: string, payload: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time verification via crypto.subtle.verify (never string ===). */
export async function verify(secret: string, payload: string, hexSig: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(hexSig)) return false;
  const bytes = new Uint8Array(hexSig.match(/../g)!.map((h) => parseInt(h, 16)));
  return crypto.subtle.verify("HMAC", await hmacKey(secret), bytes, enc.encode(payload));
}

export const REPLAY_WINDOW_MS = 10 * 60 * 1000;

/** True when the event timestamp is outside the accepted replay window. */
export function isStale(occurredAtIso: string, nowMs = Date.now(), windowMs = REPLAY_WINDOW_MS): boolean {
  const t = Date.parse(occurredAtIso);
  return !Number.isFinite(t) || Math.abs(nowMs - t) > windowMs;
}

/** Run an async operation with a hard timeout (default 15 s total). */
export async function withTimeout<T>(op: (signal: AbortSignal) => Promise<T>, ms = 15_000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(new Error(`timeout after ${ms}ms`)), ms);
  try {
    return await op(ctl.signal);
  } finally {
    clearTimeout(timer);
  }
}
