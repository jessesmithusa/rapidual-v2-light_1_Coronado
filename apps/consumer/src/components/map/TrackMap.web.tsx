import { FallbackTrackMap } from "./FallbackTrackMap";
import type { TrackMapProps } from "./trackTypes";

export function TrackMap(props: TrackMapProps) {
  return <FallbackTrackMap {...props} />;
}

export type { TrackMapProps } from "./trackTypes";
