import { View } from "react-native";
import Mapbox, { MapView, Camera, ShapeSource, LineLayer, CircleLayer } from "@rnmapbox/maps";
import { env } from "@/lib/env";
import { MAP_STYLE_URL } from "@/theme/tokens";
import { stopColor } from "./projection";
import type { ManifestMapProps } from "./types";

Mapbox.setAccessToken(env.mapboxToken);

export function MapboxManifestMap({ stops, driver, height = 220 }: ManifestMapProps) {
  const line = {
    type: "FeatureCollection" as const,
    features: [
      { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: stops.map((s) => [s.lng, s.lat]) } },
    ],
  };
  const stopFeatures = {
    type: "FeatureCollection" as const,
    features: stops.map((s) => ({
      type: "Feature" as const,
      properties: { color: stopColor(s.kind), opacity: s.status === "done" ? 0.5 : 1 },
      geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
    })),
  };
  const driverPoint = {
    type: "FeatureCollection" as const,
    features: [{ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: [driver.lng, driver.lat] } }],
  };

  return (
    <View className="rounded-2xl overflow-hidden border border-navy-600/60" style={{ height }}>
      <MapView style={{ flex: 1 }} styleURL={MAP_STYLE_URL} scaleBarEnabled={false} logoEnabled={false} attributionEnabled={false}>
        <Camera centerCoordinate={[driver.lng, driver.lat]} zoomLevel={12.5} animationMode="easeTo" animationDuration={600} />
        <ShapeSource id="m-line" shape={line}>
          <LineLayer id="m-line-layer" style={{ lineColor: "#27365F", lineWidth: 3, lineCap: "round", lineJoin: "round" }} />
        </ShapeSource>
        <ShapeSource id="m-stops" shape={stopFeatures}>
          <CircleLayer id="m-stops-layer" style={{ circleRadius: 6, circleColor: ["get", "color"], circleOpacity: ["get", "opacity"], circleStrokeColor: "#FFFFFF", circleStrokeWidth: 1.5 }} />
        </ShapeSource>
        <ShapeSource id="m-driver" shape={driverPoint}>
          <CircleLayer id="m-driver-dot" style={{ circleRadius: 7, circleColor: "#0A1124", circleStrokeColor: "#FF6B2C", circleStrokeWidth: 2 }} />
        </ShapeSource>
      </MapView>
    </View>
  );
}
