import { View } from "react-native";
import { Text } from "./Text";

type Tone = "orange" | "navy" | "success" | "warning";
const TONE: Record<Tone, { bg: string; fg: string }> = {
  orange: { bg: "bg-orange-500/15", fg: "text-orange-400" },
  navy: { bg: "bg-navy-500/30", fg: "text-ink-muted" },
  success: { bg: "bg-success/15", fg: "text-success" },
  warning: { bg: "bg-warning/15", fg: "text-warning" },
};

export function Badge({ label, tone = "navy" }: { label: string; tone?: Tone }) {
  const t = TONE[tone];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${t.bg}`}>
      <Text className={`text-xs font-semibold ${t.fg}`}>{label}</Text>
    </View>
  );
}
