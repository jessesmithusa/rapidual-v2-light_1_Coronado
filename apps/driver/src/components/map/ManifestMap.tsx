import Constants, { ExecutionEnvironment } from "expo-constants";
import type { ComponentType } from "react";
import { FallbackManifestMap } from "./FallbackManifestMap";
import type { ManifestMapProps } from "./types";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let NativeMap: ComponentType<ManifestMapProps> | null = null;
if (!isExpoGo) {
  try {
    NativeMap = require("./MapboxManifestMap").MapboxManifestMap as ComponentType<ManifestMapProps>;
  } catch {
    NativeMap = null;
  }
}

export function ManifestMap(props: ManifestMapProps) {
  const Map = NativeMap ?? FallbackManifestMap;
  return <Map {...props} />;
}
