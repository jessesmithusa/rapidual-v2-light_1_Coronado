import { View } from "react-native";
import Svg, { Rect, Line, Path, Circle, G } from "react-native-svg";
import { Badge } from "@rapidual/ui";
import { colors } from "@/theme/tokens";
import { makeProjector, stopColor } from "./projection";
import type { ManifestMapProps } from "./types";

const W = 360;

export function FallbackManifestMap({ stops, driver, height = 220 }: ManifestMapProps) {
  const H = height;
  const project = makeProjector([...stops, driver], W, H);
  const d = stops.map((s, i) => `${i === 0 ? "M" : "L"}${project(s).x},${project(s).y}`).join(" ");
  const dr = project(driver);
  const activeIdx = stops.findIndex((s) => s.status === "active");

  return (
    <View className="rounded-2xl overflow-hidden border border-navy-600/60" style={{ height: H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} fill={colors.navy800} />
        <G opacity={0.14} stroke={colors.navy500} strokeWidth={1}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Line key={i} x1={(W / 6) * i} y1={0} x2={(W / 6) * i} y2={H} />
          ))}
        </G>
        <Path d={d} stroke={colors.navy500} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {stops.map((s) => {
          const p = project(s);
          const c = stopColor(s.kind);
          const done = s.status === "done";
          return (
            <G key={s.id} opacity={done ? 0.5 : 1}>
              {s.status === "active" ? <Circle cx={p.x} cy={p.y} r={12} fill={c} opacity={0.2} /> : null}
              <Circle cx={p.x} cy={p.y} r={6} fill={c} stroke={done ? "none" : "#fff"} strokeWidth={done ? 0 : 1.5} />
            </G>
          );
        })}
        <G>
          <Circle cx={dr.x} cy={dr.y} r={9} fill={colors.navy900} stroke={colors.orange} strokeWidth={2} />
        </G>
      </Svg>
      <View className="absolute top-3 left-3 flex-row gap-2">
        <Badge label="Laundry" tone="orange" />
        <Badge label="Parcel" tone="navy" />
      </View>
      {activeIdx >= 0 ? (
        <View className="absolute bottom-3 left-3">
          <Badge label={`Next · stop ${stops[activeIdx]!.seq}`} tone="orange" />
        </View>
      ) : null}
    </View>
  );
}
