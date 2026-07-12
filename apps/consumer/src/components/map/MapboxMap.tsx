import { View } from "react-native";
import Mapbox, { MapView, Camera, ShapeSource, LineLayer, CircleLayer } from "@rnmapbox/maps";
import { env } from "@/lib/env";
import { MAP_STYLE_URL } from "@/theme/tokens";
import { routeColor, type RouteMapProps } from "./types";

// Safe to call repeatedly; only runs on a dev/standalone build where the native module exists.
Mapbox.setAccessToken(env.mapboxToken);

export function MapboxMap({ origin, routes, height = 260 }: RouteMapProps) {
  const routeCollection = {
    type: "FeatureCollection" as const,
    features: routes.map((r) => ({
      type: "Feature" as const,
      properties: { id: r.id, color: routeColor(r.loadType) },
      geometry: {
        type: "LineString" as const,
        coordinates: r.path.map((p) => [p.lng, p.lat]),
      },
    })),
  };

  const userPoint = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: [origin.lng, origin.lat] },
      },
    ],
  };

  return (
    <View className="rounded-2xl overflow-hidden border border-navy-600/60" style={{ height }}>
      <MapView style={{ flex: 1 }} styleURL={MAP_STYLE_URL} scaleBarEnabled={false} logoEnabled={false} attributionEnabled={false}>
        <Camera centerCoordinate={[origin.lng, origin.lat]} zoomLevel={11} animationDuration={0} />

        <ShapeSource id="routes" shape={routeCollection}>
          <LineLayer
            id="route-lines"
            style={{ lineColor: ["get", "color"], lineWidth: 4, lineCap: "round", lineJoin: "round", lineOpacity: 0.9 }}
          />
        </ShapeSource>

        <ShapeSource id="user" shape={userPoint}>
          <CircleLayer id="user-halo" style={{ circleRadius: 16, circleColor: "#FF6B2C", circleOpacity: 0.18 }} />
          <CircleLayer
            id="user-dot"
            style={{ circleRadius: 6, circleColor: "#FF6B2C", circleStrokeColor: "#FFFFFF", circleStrokeWidth: 2 }}
          />
        </ShapeSource>
      </MapView>
    </View>
  );
}
