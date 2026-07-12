import { View } from "react-native";
import Svg, { Rect, Line, Path, Circle, G } from "react-native-svg";
import { Badge } from "@rapidual/ui";
import { colors } from "@/theme/tokens";
import { makeProjector } from "./projection";
import type { TrackMapProps } from "./trackTypes";

const W = 360;

export function FallbackTrackMap({ path, driver, destination, height = 220 }: TrackMapProps) {
  const H = height;
  const project = makeProjector([...path, driver, destination], W, H);
  const d = path.map((p, i) => `${i === 0 ? "M" : "L"}${project(p).x},${project(p).y}`).join(" ");
  const dr = project(driver);
  const dest = project(destination);

  return (
    <View className="rounded-2xl overflow-hidden border border-navy-600/60" style={{ height: H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} fill={colors.navy800} />
        <G opacity={0.16} stroke={colors.navy500} strokeWidth={1}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Line key={i} x1={(W / 6) * i} y1={0} x2={(W / 6) * i} y2={H} />
          ))}
        </G>
        <Path d={d} stroke={colors.orange} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        {/* destination */}
        <G>
          <Circle cx={dest.x} cy={dest.y} r={10} fill={colors.navy600} stroke={colors.ink} strokeWidth={2} />
        </G>
        {/* driver */}
        <G>
          <Circle cx={dr.x} cy={dr.y} r={14} fill={colors.orange} opacity={0.2} />
          <Circle cx={dr.x} cy={dr.y} r={6} fill={colors.orange} stroke="#fff" strokeWidth={2} />
        </G>
      </Svg>
      <View className="absolute top-3 left-3">
        <Badge label="Live · preview" tone="orange" />
      </View>
    </View>
  );
}
