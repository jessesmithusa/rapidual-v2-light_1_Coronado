import type { ManifestStop } from "@rapidual/shared";

export interface ManifestMapProps {
  stops: ManifestStop[];
  driver: { lat: number; lng: number };
  height?: number;
}
