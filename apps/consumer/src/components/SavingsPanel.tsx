import { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card } from "@rapidual/ui";
import { currency, savingsFor, orderValue } from "@rapidual/utils";
import { colors } from "@/theme/tokens";

type MetricKey = "water" | "energy" | "co2" | "time";

const EXPLAIN: Record<MetricKey, string> = {
  water: "A standard home washer uses ~20 gallons per load (ENERGY STAR). We batch loads on efficient equipment to cut that down.",
  energy: "High-efficiency commercial machines use far less power per load than a home washer + dryer.",
  co2: "Fewer kWh and one shared route instead of your own car trip means less CO₂ per order.",
  time: "About 25 active minutes per machine load — sorting, transferring, folding. A bag is ~1.5 loads, so ~38 minutes back per bag.",
};

export interface SavingsPanelProps {
  bagCount: number;
  orderTotal: number;
  promoCode: string;
  setPromoCode: (s: string) => void;
  applyPromo: () => void;
  promoNote: string | null;
  promoActive: boolean;
  discount: number;
  dueNow: number;
  pointsToEarn: number;
}

export function SavingsPanel(props: SavingsPanelProps) {
  const { bagCount, orderTotal } = props;
  const s = savingsFor(bagCount);
  const { savings, realPrice } = orderValue(orderTotal, bagCount);
  const [open, setOpen] = useState<MetricKey | null>(null);

  const metrics: { key: MetricKey; value: number; unit: string; icon: keyof typeof Ionicons.glyphMap; tint: string; bar: number }[] = [
    { key: "water", value: s.gallons, unit: "Gallons", icon: "water", tint: "#60A5FA", bar: 0.8 },
    { key: "energy", value: s.kwh, unit: "Kilowatts", icon: "flash", tint: "#F59E0B", bar: 0.55 },
    { key: "co2", value: s.co2, unit: "Pounds CO₂", icon: "leaf", tint: "#34D399", bar: 0.45 },
    { key: "time", value: s.minutes, unit: "Minutes", icon: "timer", tint: "#A78BFA", bar: 0.7 },
  ];

  return (
    <View>
      <View className="rounded-2xl bg-success/10 py-3 items-center flex-row justify-center">
        <Ionicons name="trending-up" size={16} color={colors.success} />
        <Text className="text-success font-semibold ml-2">Environmental &amp; Cost Savings</Text>
      </View>

      <View className="flex-row flex-wrap justify-between mt-3">
        {metrics.map((m) => (
          <Pressable key={m.key} onPress={() => setOpen((o) => (o === m.key ? null : m.key))} className="w-[48.5%] mb-3">
            <Card className={`items-center py-4 ${open === m.key ? "border-orange-500" : ""}`}>
              <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: m.tint + "22" }}>
                <Ionicons name={m.icon} size={20} color={m.tint} />
              </View>
              <Text variant="title" className="mt-2">{m.value}</Text>
              <Text variant="caption">{m.unit}</Text>
              <View className="h-1.5 rounded-full bg-navy-600 w-full mt-3 overflow-hidden">
                <View className="h-full rounded-full" style={{ width: `${m.bar * 100}%`, backgroundColor: m.tint }} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      {open ? (
        <View className="rounded-xl bg-navy-700 border border-navy-600/60 p-3 -mt-1 mb-2">
          <Text variant="caption" className="leading-5">{EXPLAIN[open]}</Text>
        </View>
      ) : (
        <Text variant="caption" className="text-center mb-1">💡 Tap any card to learn how we calculate savings</Text>
      )}

      <View className="flex-row gap-3 mt-2">
        <View className="flex-1 rounded-2xl p-4 items-center" style={{ backgroundColor: "#10B981" }}>
          <Text className="text-white/90 font-semibold text-center">Total Cost Savings</Text>
          <Text className="text-white text-3xl font-extrabold mt-1">{currency(savings)}</Text>
          <Text className="text-white/85 text-xs text-center mt-1">your utility, environmental &amp; time value</Text>
        </View>
        <View className="flex-1 rounded-2xl p-4 items-center" style={{ backgroundColor: "#3B82F6" }}>
          <Text className="text-white/90 font-semibold text-center">Real Order Price</Text>
          <Text className="text-white text-3xl font-extrabold mt-1">{currency(realPrice)}</Text>
          <Text className="text-white/85 text-xs text-center mt-1">after your utility, environmental &amp; time value</Text>
        </View>
      </View>

      <Card elevated className="mt-3">
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center rounded-xl bg-navy-600 border border-navy-500 px-3 py-2.5">
            <Ionicons name="pricetag-outline" size={16} color={colors.inkFaint} />
            <TextInput
              value={props.promoCode}
              onChangeText={props.setPromoCode}
              placeholder="Add promo code"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="characters"
              style={{ flex: 1, marginLeft: 8, color: colors.ink, fontSize: 14 }}
            />
          </View>
          <Pressable onPress={props.applyPromo} className="rounded-xl bg-orange-500 px-4 py-2.5 ml-2 active:opacity-80">
            <Text className="text-white font-bold text-sm">Apply</Text>
          </Pressable>
        </View>
        {props.promoNote ? (
          <Text variant="caption" className={`mt-2 ${props.promoActive ? "text-success" : "text-danger"}`}>{props.promoNote}</Text>
        ) : null}

        {props.discount > 0 ? (
          <View className="flex-row justify-between mt-3">
            <Text variant="label" className="text-success">Applied Discount</Text>
            <Text variant="body" className="text-success">−{currency(props.discount)}</Text>
          </View>
        ) : null}

        <View className="h-px bg-navy-600 my-3" />
        <View className="flex-row justify-between items-center">
          <Text variant="heading">You pay now</Text>
          <Text variant="heading" className="text-orange-400">{currency(props.dueNow)}</Text>
        </View>
        <View className="flex-row items-center mt-3 pt-3 border-t border-navy-600/60">
          <Ionicons name="star" size={15} color={colors.orange} />
          <Text variant="caption" className="ml-2">You'll earn ~{props.pointsToEarn} Rapid Points on this order</Text>
        </View>
      </Card>
    </View>
  );
}
