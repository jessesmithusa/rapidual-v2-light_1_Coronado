import type { LatLng } from "./types";

/**
 * Build a linear lat/lng → x/y projector that fits all points inside a
 * padded box. Used by the SVG fallback map (Expo Go) where Mapbox isn't linked.
 */
export function makeProjector(points: LatLng[], width: number, height: number, pad = 28) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  // Avoid div-by-zero for a single point.
  if (maxLat - minLat < 1e-4) { minLat -= 0.01; maxLat += 0.01; }
  if (maxLng - minLng < 1e-4) { minLng -= 0.01; maxLng += 0.01; }

  const sx = (width - pad * 2) / (maxLng - minLng);
  const sy = (height - pad * 2) / (maxLat - minLat);

  return (p: LatLng) => ({
    x: pad + (p.lng - minLng) * sx,
    y: pad + (maxLat - p.lat) * sy, // invert: north is up
  });
}
