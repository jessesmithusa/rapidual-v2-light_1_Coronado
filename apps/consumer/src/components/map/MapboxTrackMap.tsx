import { View } from "react-native";
import Mapbox, { MapView, Camera, ShapeSource, LineLayer, CircleLayer } from "@rnmapbox/maps";
import { env } from "@/lib/env";
import { MAP_STYLE_URL } from "@/theme/tokens";
import type { TrackMapProps } from "./trackTypes";

Mapbox.setAccessToken(env.mapboxToken);

const point = (p: { lat: number; lng: number }) => ({
  type: "FeatureCollection" as const,
  features: [
    { type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] } },
  ],
});

export function MapboxTrackMap({ path, driver, destination, height = 220 }: TrackMapProps) {
  const line = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: path.map((p) => [p.lng, p.lat]) },
      },
    ],
  };

  return (
    <View className="rounded-2xl overflow-hidden border border-navy-600/60" style={{ height }}>
      <MapView style={{ flex: 1 }} styleURL={MAP_STYLE_URL} scaleBarEnabled={false} logoEnabled={false} attributionEnabled={false}>
        <Camera centerCoordinate={[driver.lng, driver.lat]} zoomLevel={12.5} animationMode="easeTo" animationDuration={800} />

        <ShapeSource id="track-line" shape={line}>
          <LineLayer id="track-line-layer" style={{ lineColor: "#FF6B2C", lineWidth: 4, lineCap: "round", lineJoin: "round", lineOpacity: 0.85 }} />
        </ShapeSource>

        <ShapeSource id="dest" shape={point(destination)}>
          <CircleLayer id="dest-dot" style={{ circleRadius: 7, circleColor: "#17181C", circleStrokeColor: "#FFFFFF", circleStrokeWidth: 2 }} />
        </ShapeSource>

        <ShapeSource id="driver" shape={point(driver)}>
          <CircleLayer id="driver-halo" style={{ circleRadius: 18, circleColor: "#FF6B2C", circleOpacity: 0.2 }} />
          <CircleLayer id="driver-dot" style={{ circleRadius: 7, circleColor: "#FF6B2C", circleStrokeColor: "#FFFFFF", circleStrokeWidth: 2 }} />
        </ShapeSource>
      </MapView>
    </View>
  );
}
