import { useEffect, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card, Badge } from "@rapidual/ui";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { DISPATCH_ROUTES, type DispatchRoute, type RouteStatus } from "@/mock/dispatch";
import { fetchDispatchRoutes } from "@/data/live";

const STATUS: Record<RouteStatus, { label: string; tone: "success" | "warning" | "navy" }> = {
  on_time: { label: "On time", tone: "success" },
  behind: { label: "Behind", tone: "warning" },
  idle: { label: "Unassigned", tone: "navy" },
};

export default function Dispatch() {
  const router = useRouter();
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});
  const [routes, setRoutes] = useState<DispatchRoute[]>(DISPATCH_ROUTES);
  useEffect(() => {
    void fetchDispatchRoutes().then((live) => {
      if (!live) return;
      setRoutes(live.map((r) => ({
        id: r.id, name: r.name, driver: null,
        done: r.done, total: Math.max(r.total, 1),
        utilization: r.utilization,
        status: r.total === 0 ? "idle" : r.done < r.total ? "on_time" : "on_time",
        exceptions: 0,
      })));
    });
  }, []);

  const active = routes.filter((r) => r.driver || assigned[r.id]).length;
  const live = routes.filter((r) => r.driver);
  const avgUtil = Math.round((live.reduce((a, r) => a + r.utilization, 0) / Math.max(1, live.length)) * 100);
  const exceptions = routes.reduce((a, r) => a + r.exceptions, 0);

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title" className="ml-2">Dispatch</Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3">
          <Card className="flex-1 items-center py-4"><Text variant="title" className="text-orange-400">{active}</Text><Text variant="caption" className="mt-1">Active routes</Text></Card>
          <Card className="flex-1 items-center py-4"><Text variant="title" className="text-success">{avgUtil}%</Text><Text variant="caption" className="mt-1">Avg utilization</Text></Card>
          <Card className="flex-1 items-center py-4"><Text variant="title" className={exceptions ? "text-orange-400" : ""}>{exceptions}</Text><Text variant="caption" className="mt-1">Exceptions</Text></Card>
        </View>

        <Text variant="heading" className="mt-6 mb-3">Routes today</Text>
        {routes.map((r) => {
          const isAssigned = !!r.driver || assigned[r.id];
          const st = isAssigned && !r.driver ? STATUS.on_time : STATUS[r.status];
          return (
            <Card key={r.id} className="mb-3">
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text variant="heading" className="text-base">{r.name}</Text>
                  <Text variant="caption" className="mt-0.5">
                    {r.driver ?? (assigned[r.id] ? "You · assigned" : "No driver assigned")}
                  </Text>
                </View>
                <Badge label={st.label} tone={st.tone} />
              </View>

              {isAssigned ? (
                <>
                  <View className="h-1.5 rounded-full bg-navy-900 mt-3 overflow-hidden">
                    <View className="h-full bg-orange-500 rounded-full" style={{ width: `${(r.done / r.total) * 100}%` }} />
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Text variant="caption">{r.done} of {r.total} stops</Text>
                    {r.utilization > 0 ? <Text variant="caption" className="ml-auto text-success">{Math.round(r.utilization * 100)}% loaded</Text> : null}
                  </View>
                  {r.exceptions > 0 ? (
                    <View className="flex-row items-center mt-2 pt-2 border-t border-navy-600/60">
                      <Ionicons name="warning" size={15} color={colors.orange} />
                      <Text variant="caption" className="ml-2 text-orange-400">{r.exceptions} exception{r.exceptions > 1 ? "s" : ""} need review</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Pressable onPress={() => setAssigned((a) => ({ ...a, [r.id]: true }))} className="rounded-xl bg-orange-500 py-2.5 items-center mt-3 active:opacity-80">
                  <Text className="text-navy-900 font-bold">Assign to me</Text>
                </Pressable>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
