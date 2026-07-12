import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card } from "@rapidual/ui";
import { currency, driverPayout } from "@rapidual/utils";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";

const PAYOUTS = [
  { id: "p1", week: "May 19 – 25", amount: 642.5, status: "Paid" },
  { id: "p2", week: "May 12 – 18", amount: 588.0, status: "Paid" },
  { id: "p3", week: "May 5 – 11", amount: 611.25, status: "Paid" },
];

export default function Earnings() {
  const router = useRouter();
  const today = driverPayout(8, 22);
  const weekStops = 47;
  const weekTips = 96;
  const week = driverPayout(weekStops, weekTips, { base: 18 * 5 });

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title" className="ml-2">Earnings</Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <Card elevated className="items-center py-6">
          <Text variant="caption">TODAY</Text>
          <Text variant="display" className="text-orange-400 mt-1">{currency(today.total)}</Text>
          <Text variant="label" className="mt-1">{today.stops} stops · {currency(today.tips)} tips</Text>
        </Card>

        <Card className="mt-3">
          <Text variant="heading" className="text-base mb-2">Today's breakdown</Text>
          <View className="flex-row justify-between py-1.5"><Text variant="label">Base</Text><Text variant="body">{currency(today.base)}</Text></View>
          <View className="flex-row justify-between py-1.5"><Text variant="label">Per-stop ({today.stops} × $3.50)</Text><Text variant="body">{currency(today.perStopPay)}</Text></View>
          <View className="flex-row justify-between py-1.5"><Text variant="label">Tips</Text><Text variant="body" className="text-success">{currency(today.tips)}</Text></View>
          <View className="h-px bg-navy-600 my-2" />
          <View className="flex-row justify-between"><Text variant="heading">Total</Text><Text variant="heading" className="text-orange-400">{currency(today.total)}</Text></View>
        </Card>

        <Card elevated className="mt-3 flex-row items-center">
          <View className="flex-1">
            <Text variant="caption">THIS WEEK</Text>
            <Text variant="heading" className="text-xl mt-0.5">{currency(week.total)}</Text>
            <Text variant="caption" className="mt-0.5">{weekStops} stops · {currency(week.tips)} tips</Text>
          </View>
          <View className="items-end">
            <Text variant="caption">NEXT PAYOUT</Text>
            <Text variant="heading" className="text-base mt-0.5">Mon</Text>
          </View>
        </Card>

        <Text variant="heading" className="mt-6 mb-3">Payout history</Text>
        {PAYOUTS.map((p) => (
          <Card key={p.id} className="mb-2.5 flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-success/15 items-center justify-center"><Ionicons name="cash" size={20} color={colors.success} /></View>
            <View className="flex-1 ml-3">
              <Text variant="body" className="text-sm">{p.week}</Text>
              <Text variant="caption" className="mt-0.5 text-success">{p.status}</Text>
            </View>
            <Text variant="heading" className="text-base">{currency(p.amount)}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
