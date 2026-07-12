import type { Route } from "@rapidual/shared";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteMapProps {
  origin: LatLng;
  routes: Route[];
  height?: number;
}

/** Brand color per route based on what it carries. */
export const routeColor = (loadType: Route["loadType"]) =>
  loadType === "dual" ? "#FF6B2C" : loadType === "parcel" ? "#3A4C7A" : "#FF8552";
