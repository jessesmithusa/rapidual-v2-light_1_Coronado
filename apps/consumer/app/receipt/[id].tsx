import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button } from "@rapidual/ui";
import { currency, pickupQuote, savingsFor } from "@rapidual/utils";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/theme/tokens";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text variant={strong ? "heading" : "label"} className={strong ? "" : ""}>{label}</Text>
      <Text variant={strong ? "heading" : "body"} className={strong ? "text-orange-400" : ""}>{value}</Text>
    </View>
  );
}

export default function Receipt() {
  const router = useRouter();
  const { id, bags } = useLocalSearchParams<{ id: string; bags?: string }>();
  const n = Math.max(1, Number(bags ?? 3));
  const q = pickupQuote(n);
  const s = savingsFor(n);

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Receipt</Text>
      </View>

      <Card elevated>
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text variant="heading">Wash · Dry · Fold</Text>
            <Text variant="caption" className="mt-0.5">Order {String(id).toUpperCase()}</Text>
          </View>
          <View className="rounded-full bg-success/15 px-3 py-1"><Text className="text-success text-xs font-semibold">Delivered</Text></View>
        </View>
        <View className="h-px bg-navy-600 mb-2" />
        {q.breakdown.map((p, i) => (
          <Row key={i} label={`Bag ${i + 1}`} value={currency(p)} />
        ))}
        <View className="h-px bg-navy-600 my-2" />
        <Row label="Subtotal" value={currency(q.total)} />
        <Row label="Promo" value="—" />
        <View className="h-px bg-navy-600 my-2" />
        <Row label="Total paid" value={currency(q.total)} strong />
      </Card>

      <Card className="mt-3 flex-row items-center">
        <Ionicons name="leaf" size={20} color={colors.success} />
        <Text variant="caption" className="ml-3 flex-1 leading-5">
          This order saved ~{s.gallons} gal water, {s.kwh} kWh, and {s.minutes} min — about {currency(s.value.total)} in value.
        </Text>
      </Card>

      <Button title="Report a problem" variant="ghost" className="mt-4" onPress={() => router.push(`/report/${id}`)} />
    </Screen>
  );
}
