import { FallbackMap } from "./FallbackMap";
import type { RouteMapProps } from "./types";

export function RouteMap(props: RouteMapProps) {
  return <FallbackMap {...props} />;
}

export type { RouteMapProps } from "./types";
