import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card } from "@rapidual/ui";
import { daysOfWeek } from "@rapidual/utils";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { useRecurring } from "@/store/recurring";

function nextDateFor(weekday: number): string {
  const d = new Date();
  const delta = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function Recurring() {
  const router = useRouter();
  const { active, weekday, bags, setActive, setWeekday, setBags } = useRecurring();

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Standing pickup</Text>
      </View>

      <Card elevated className="flex-row items-center">
        <View className="flex-1">
          <Text variant="heading" className="text-base">Repeat weekly</Text>
          <Text variant="caption" className="mt-0.5">A driver swings by every week — pay per bag, cancel anytime.</Text>
        </View>
        <Pressable onPress={() => setActive(!active)}>
          <Ionicons name={active ? "toggle" : "toggle-outline"} size={40} color={active ? colors.orange : colors.inkFaint} />
        </Pressable>
      </Card>

      <View style={{ opacity: active ? 1 : 0.4 }} pointerEvents={active ? "auto" : "none"}>
        <Text variant="heading" className="mt-6 mb-3">Pickup day</Text>
        <View className="flex-row flex-wrap gap-2">
          {daysOfWeek.map((d, i) => (
            <Pressable
              key={d}
              onPress={() => setWeekday(i)}
              className={`px-4 py-2.5 rounded-xl ${i === weekday ? "bg-orange-500" : "bg-navy-700 border border-navy-600/60"}`}
            >
              <Text className={i === weekday ? "text-white font-semibold" : "text-ink-muted"}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <Text variant="heading" className="mt-6 mb-3">Usual bags</Text>
        <Card className="flex-row items-center justify-between">
          <Pressable onPress={() => setBags(bags - 1)} className="w-11 h-11 rounded-full bg-navy-600 border border-navy-500 items-center justify-center"><Ionicons name="remove" size={22} color={colors.ink} /></Pressable>
          <Text variant="display">{bags}</Text>
          <Pressable onPress={() => setBags(bags + 1)} className="w-11 h-11 rounded-full bg-orange-500 items-center justify-center"><Ionicons name="add" size={22} color="#FFFFFF" /></Pressable>
        </Card>

        <Card elevated className="mt-6 flex-row items-center">
          <Ionicons name="calendar" size={20} color={colors.orange} />
          <Text variant="label" className="ml-3 flex-1">Next pickup</Text>
          <Text variant="heading" className="text-base">{nextDateFor(weekday)}</Text>
        </Card>
      </View>

      <Text variant="caption" className="text-center mt-6">
        {active ? "We'll remind you the day before — adjust bag count anytime." : "Turn on to lock in a weekly slot on your route."}
      </Text>
    </Screen>
  );
}
