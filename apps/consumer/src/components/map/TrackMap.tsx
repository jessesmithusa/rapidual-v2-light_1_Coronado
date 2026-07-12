import Constants, { ExecutionEnvironment } from "expo-constants";
import type { ComponentType } from "react";
import { FallbackTrackMap } from "./FallbackTrackMap";
import type { TrackMapProps } from "./trackTypes";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let NativeTrackMap: ComponentType<TrackMapProps> | null = null;
if (!isExpoGo) {
  try {
    NativeTrackMap = require("./MapboxTrackMap").MapboxTrackMap as ComponentType<TrackMapProps>;
  } catch {
    NativeTrackMap = null;
  }
}

export function TrackMap(props: TrackMapProps) {
  const Map = NativeTrackMap ?? FallbackTrackMap;
  return <Map {...props} />;
}

export type { TrackMapProps } from "./trackTypes";
