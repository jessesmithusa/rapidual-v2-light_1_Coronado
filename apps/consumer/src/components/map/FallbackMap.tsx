import { View } from "react-native";
import Svg, { Rect, Line, Path, Circle, G } from "react-native-svg";
import { Badge, Text } from "@rapidual/ui";
import { colors } from "@/theme/tokens";
import { makeProjector } from "./projection";
import { routeColor, type RouteMapProps } from "./types";

const W = 360;

/** Pure-SVG route map for Expo Go (no native Mapbox). Still shows real OC geometry. */
export function FallbackMap({ origin, routes, height = 260 }: RouteMapProps) {
  const H = height;
  const allPoints = [origin, ...routes.flatMap((r) => r.path)];
  const project = makeProjector(allPoints, W, H);

  return (
    <View className="rounded-2xl overflow-hidden border border-navy-600/60" style={{ height: H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} fill={colors.navy800} />
        {/* faint grid */}
        <G opacity={0.18}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Line key={`v${i}`} x1={(W / 6) * i} y1={0} x2={(W / 6) * i} y2={H} stroke={colors.navy500} strokeWidth={1} />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <Line key={`h${i}`} x1={0} y1={(H / 4) * i} x2={W} y2={(H / 4) * i} stroke={colors.navy500} strokeWidth={1} />
          ))}
        </G>

        {/* route polylines */}
        {routes.map((r) => {
          const pts = r.path.map(project);
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
          return (
            <G key={r.id}>
              <Path d={d} stroke={routeColor(r.loadType)} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={3} fill={routeColor(r.loadType)} />
              ))}
            </G>
          );
        })}

        {/* user location */}
        {(() => {
          const u = project(origin);
          return (
            <G>
              <Circle cx={u.x} cy={u.y} r={12} fill={colors.orange} opacity={0.18} />
              <Circle cx={u.x} cy={u.y} r={5} fill={colors.orange} stroke="#fff" strokeWidth={2} />
            </G>
          );
        })()}
      </Svg>

      <View className="absolute top-3 left-3">
        <Badge label="Map preview" tone="navy" />
      </View>
      <View className="absolute bottom-3 left-3 right-3">
        <Text variant="caption">Live Mapbox map enables in a dev build.</Text>
      </View>
    </View>
  );
}
