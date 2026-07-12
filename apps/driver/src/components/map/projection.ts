export interface LatLng { lat: number; lng: number }

export function makeProjector(points: LatLng[], width: number, height: number, pad = 22) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats), maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  if (maxLat - minLat < 1e-4) { minLat -= 0.01; maxLat += 0.01; }
  if (maxLng - minLng < 1e-4) { minLng -= 0.01; maxLng += 0.01; }
  const sx = (width - pad * 2) / (maxLng - minLng);
  const sy = (height - pad * 2) / (maxLat - minLat);
  return (p: LatLng) => ({ x: pad + (p.lng - minLng) * sx, y: pad + (maxLat - p.lat) * sy });
}

export const stopColor = (kind: "pickup" | "redeliver" | "parcel") =>
  kind === "parcel" ? "#85B7EB" : kind === "redeliver" ? "#FF8552" : "#FF6B2C";
