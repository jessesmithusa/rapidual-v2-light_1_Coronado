import Constants, { ExecutionEnvironment } from "expo-constants";
import type { ComponentType } from "react";
import { FallbackMap } from "./FallbackMap";
import type { RouteMapProps } from "./types";

// Expo Go ships a fixed native binary, so custom native modules (Mapbox) aren't present.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let NativeMap: ComponentType<RouteMapProps> | null = null;
if (!isExpoGo) {
  try {
    // Only evaluated on a dev/standalone build, so @rnmapbox/maps never loads in Expo Go.
    NativeMap = require("./MapboxMap").MapboxMap as ComponentType<RouteMapProps>;
  } catch {
    NativeMap = null;
  }
}

export function RouteMap(props: RouteMapProps) {
  const Map = NativeMap ?? FallbackMap;
  return <Map {...props} />;
}

export type { RouteMapProps } from "./types";
