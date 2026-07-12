import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Badge } from "@rapidual/ui";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { useLoyalty, tierForPoints, REWARDS, EARN_RULES } from "@/store/loyalty";

export default function Rewards() {
  const router = useRouter();
  const points = useLoyalty((s) => s.points);
  const redeemed = useLoyalty((s) => s.redeemed);
  const redeem = useLoyalty((s) => s.redeem);
  const { current, next, toNext, progress } = tierForPoints(points);

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Rapid Points</Text>
      </View>

      <Card elevated className="items-center py-6">
        <Text variant="caption">YOUR BALANCE</Text>
        <Text variant="display" className="text-orange-400 mt-1">{points.toLocaleString()}</Text>
        <Badge label={`${current.name} member`} tone="orange" />
        {next ? (
          <View className="w-full mt-5">
            <View className="flex-row justify-between mb-2">
              <Text variant="caption">{current.name}</Text>
              <Text variant="caption">{toNext.toLocaleString()} pts to {next.name}</Text>
            </View>
            <View className="h-2.5 rounded-full bg-navy-600 overflow-hidden">
              <View className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.round(progress * 100)}%` }} />
            </View>
          </View>
        ) : (
          <Text variant="caption" className="mt-4">Top tier — enjoy every perk 🎉</Text>
        )}
      </Card>

      <Text variant="heading" className="mt-6 mb-3">How to Earn Points</Text>
      <Card>
        {EARN_RULES.map((r, i) => (
          <View key={r.label} className={`flex-row items-center py-3 ${i > 0 ? "border-t border-navy-600/60" : ""}`}>
            <Ionicons name={r.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.orange} />
            <Text variant="body" className="flex-1 ml-3 text-sm">{r.label}</Text>
            <Text className="text-orange-400 font-bold">{r.points}</Text>
          </View>
        ))}
      </Card>

      <Text variant="heading" className="mt-6 mb-3">Available Rewards</Text>
      {REWARDS.map((r) => {
        const owned = redeemed.includes(r.id);
        const affordable = points >= r.cost;
        return (
          <Card key={r.id} className="mb-3 flex-row items-center">
            <View className="w-11 h-11 rounded-2xl bg-orange-500/15 items-center justify-center">
              <Ionicons name={r.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.orange} />
            </View>
            <View className="flex-1 ml-3">
              <Text variant="heading" className="text-base">{r.title}</Text>
              <Text variant="caption" className="mt-0.5">{r.description}</Text>
              <Text variant="caption" className="mt-1 text-orange-400">{r.cost.toLocaleString()} points</Text>
            </View>
            <Pressable
              disabled={owned || !affordable}
              onPress={() => redeem(r)}
              className={`rounded-full px-4 py-2 ${owned ? "bg-success/20" : affordable ? "bg-orange-500" : "bg-navy-600 border border-navy-500"}`}
            >
              <Text className={`text-xs font-bold ${owned ? "text-success" : affordable ? "text-white" : "text-ink-faint"}`}>
                {owned ? "Redeemed" : "Redeem"}
              </Text>
            </Pressable>
          </Card>
        );
      })}
      <Text variant="caption" className="text-center mt-2 mb-2">Access exclusive offers and member pricing</Text>
    </Screen>
  );
}
