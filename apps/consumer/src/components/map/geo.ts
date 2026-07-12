import type { LatLng } from "./types";

/** Interpolate a point a fraction `t` (0..1) along a polyline. */
export function pointAlongPath(path: LatLng[], t: number): LatLng {
  if (path.length === 0) return { lat: 0, lng: 0 };
  const first = path[0]!;
  if (path.length === 1) return first;

  const clamped = Math.max(0, Math.min(1, t));
  const seg = clamped * (path.length - 1);
  const i = Math.min(path.length - 2, Math.floor(seg));
  const f = seg - i;
  const a = path[i]!;
  const b = path[i + 1]!;
  return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
}
