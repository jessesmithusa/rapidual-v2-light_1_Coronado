/** GeoLite2 file locations — configured via env, NEVER bundled into Git or
 * Docker images (large, licensed). Defaults match the codex server layout.
 * Reading .mmdb requires a MaxMind reader (deferred; add only when a feature
 * needs IP lookup). This module only resolves + sanity-bounds coordinates. */

export interface GeoConfig {
  mmdbPath: string;
  locationsCsvPath: string;
}

export function geoConfig(env: Record<string, string | undefined> = {}): GeoConfig {
  return {
    mmdbPath: env.GEOIP_MMDB_PATH ?? "/var/apps/GeoLite2-City.mmdb",
    locationsCsvPath: env.GEOIP_LOCATIONS_CSV_PATH ?? "/var/apps/GeoLite2-City-Locations-en.csv",
  };
}

/** Coronado service-area bounding box; rejects coordinates outside it. */
export const CORONADO_BBOX = { minLat: 32.62, maxLat: 32.705, minLng: -117.26, maxLng: -117.12 } as const;

export function inServiceArea(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= CORONADO_BBOX.minLat && lat <= CORONADO_BBOX.maxLat &&
    lng >= CORONADO_BBOX.minLng && lng <= CORONADO_BBOX.maxLng
  );
}
