import type { LatLng } from "./types";

export interface TrackMapProps {
  path: LatLng[];
  driver: LatLng;
  destination: LatLng;
  height?: number;
}
