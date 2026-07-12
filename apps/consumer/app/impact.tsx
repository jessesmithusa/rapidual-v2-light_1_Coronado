import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card } from "@rapidual/ui";
import { currency, lifetimeSavings } from "@rapidual/utils";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { useImpact } from "@/store/impact";

export default function Impact() {
  const router = useRouter();
  const bags = useImpact((s) => s.bags);
  const s = lifetimeSavings(bags);
  const hours = Math.round((s.minutes / 60) * 10) / 10;

  const stats: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; tint: string }[] = [
    { icon: "water", value: s.gallons.toLocaleString(), label: "Gallons of water", tint: "#60A5FA" },
    { icon: "flash", value: `${s.kwh}`, label: "Kilowatt-hours", tint: "#F59E0B" },
    { icon: "leaf", value: `${s.co2}`, label: "Pounds of CO₂", tint: "#34D399" },
    { icon: "time", value: `${hours}`, label: "Hours saved", tint: "#A78BFA" },
  ];

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Your impact</Text>
      </View>

      <Card elevated className="items-center py-6">
        <Text variant="caption">SAVED ACROSS {bags.length} ORDERS</Text>
        <Text variant="display" className="text-success mt-1">{currency(s.value)}</Text>
        <Text variant="label" className="mt-1">in utility, environmental &amp; time value</Text>
      </Card>

      <View className="flex-row flex-wrap justify-between mt-3">
        {stats.map((st) => (
          <Card key={st.label} className="w-[48.5%] items-center py-5 mb-3">
            <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: st.tint + "22" }}>
              <Ionicons name={st.icon} size={22} color={st.tint} />
            </View>
            <Text variant="title" className="mt-2">{st.value}</Text>
            <Text variant="caption" className="text-center">{st.label}</Text>
          </Card>
        ))}
      </View>

      <Card className="mt-2 flex-row items-start">
        <Ionicons name="hourglass" size={20} color={colors.orange} />
        <Text variant="caption" className="ml-3 flex-1 leading-5">
          A household that shifts its full laundry load to Rapidual gets back ~130 hours a year — with same-day delivery replacing store trips, that's close to a full week of waking life, every year.
        </Text>
      </Card>

      <Card className="mt-2 flex-row items-start">
        <Ionicons name="swap-horizontal" size={20} color={colors.orange} />
        <Text variant="caption" className="ml-3 flex-1 leading-5">
          Most of this comes from sharing one route loaded both ways — your laundry and your neighbors' parcels on the same trip instead of separate cars.
        </Text>
      </Card>
    </Screen>
  );
}
