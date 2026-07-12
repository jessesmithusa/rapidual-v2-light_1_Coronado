import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card } from "@rapidual/ui";
import { currency } from "@rapidual/utils";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { type ActivityStatus } from "@/mock/activity";
import { useActivity } from "@/store/activity";

const TABS: { key: ActivityStatus; label: string }[] = [
  { key: "in_progress", label: "In Progress" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

const RESCHEDULE_DAYS = ["Wed, 9:00 AM", "Fri, 9:00 AM", "Sat, 11:00 AM"];

function Chip({ icon, label, onPress, tone = "muted" }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; tone?: "muted" | "orange" | "danger" }) {
  const color = tone === "orange" ? colors.orange : tone === "danger" ? colors.danger : colors.inkMuted;
  return (
    <Pressable onPress={onPress} className="flex-row items-center rounded-full bg-navy-600 border border-navy-500 px-3 py-1.5 active:opacity-80">
      <Ionicons name={icon} size={14} color={color} />
      <Text className="text-xs font-semibold ml-1.5" style={{ color }}>{label}</Text>
    </Pressable>
  );
}

export default function Activity() {
  const router = useRouter();
  const items = useActivity((s) => s.items);
  const reschedule = useActivity((s) => s.reschedule);
  const cancel = useActivity((s) => s.cancel);
  const [status, setStatus] = useState<ActivityStatus>("in_progress");
  const [editing, setEditing] = useState<string | null>(null);

  const list = useMemo(() => items.filter((a) => a.status === status), [items, status]);

  return (
    <Screen scroll>
      <Text variant="title" className="pt-2">Activity</Text>
      <Text variant="label" className="mt-1 mb-4">Track your orders and manage your laundry</Text>

      <View className="flex-row rounded-2xl bg-navy-700 border border-navy-600/60 p-1">
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setStatus(t.key)} className={`flex-1 rounded-xl py-2.5 items-center ${status === t.key ? "bg-orange-500" : ""}`}>
            <Text className={`text-sm font-semibold ${status === t.key ? "text-white" : "text-ink-muted"}`}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-4">
        {list.length === 0 ? (
          <Card className="items-center py-10">
            <Ionicons name="receipt-outline" size={32} color={colors.inkFaint} />
            <Text variant="label" className="mt-3">Nothing here yet</Text>
            <Text variant="caption" className="mt-1">You'll see order updates and important messages here</Text>
          </Card>
        ) : (
          list.map((a) => (
            <Card key={a.id} className="mb-3">
              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${a.kind === "laundry" ? "bg-orange-500/15" : "bg-blue-500/15"}`}>
                  <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={22} color={a.kind === "laundry" ? colors.orange : "#60A5FA"} />
                </View>
                <View className="flex-1 ml-3">
                  <Text variant="heading" className="text-base">{a.title}</Text>
                  <Text variant="caption" className="mt-0.5">{a.subtitle}</Text>
                  <Text variant="caption" className="mt-0.5 text-ink-faint">{a.date}</Text>
                </View>
                <Text variant="body" className="font-semibold">{currency(a.amount)}</Text>
              </View>

              {/* Per-status actions */}
              <View className="flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-navy-600/60">
                {a.status === "in_progress" && a.kind === "laundry" ? (
                  <>
                    <Chip icon="navigate" label="Track" tone="orange" onPress={() => router.push("/track")} />
                    <Chip icon="qr-code" label="Bag tags" onPress={() => router.push(`/bag-tags/${a.id}?bags=3`)} />
                  </>
                ) : null}
                {a.status === "in_progress" && a.kind === "retail" ? (
                  <Chip icon="cube" label="Out for delivery" onPress={() => {}} />
                ) : null}

                {a.status === "upcoming" ? (
                  <>
                    <Chip icon="calendar" label={editing === a.id ? "Pick a day" : "Reschedule"} tone="orange" onPress={() => setEditing(editing === a.id ? null : a.id)} />
                    <Chip icon="close" label="Cancel" tone="danger" onPress={() => cancel(a.id)} />
                  </>
                ) : null}

                {a.status === "completed" && a.kind === "laundry" ? (
                  <>
                    <Chip icon="receipt" label="Receipt" onPress={() => router.push(`/receipt/${a.id}?bags=3`)} />
                    <Chip icon="star" label="Rate" tone="orange" onPress={() => router.push(`/rate/${a.id}`)} />
                    <Chip icon="alert-circle" label="Issue" onPress={() => router.push(`/report/${a.id}`)} />
                  </>
                ) : null}
                {a.status === "completed" && a.kind === "retail" ? (
                  <>
                    <Chip icon="receipt" label="Receipt" onPress={() => router.push(`/receipt/${a.id}?bags=1`)} />
                    <Chip icon="alert-circle" label="Issue" onPress={() => router.push(`/report/${a.id}`)} />
                  </>
                ) : null}
              </View>

              {editing === a.id ? (
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {RESCHEDULE_DAYS.map((d) => (
                    <Pressable key={d} onPress={() => { reschedule(a.id, d); setEditing(null); }} className="rounded-xl bg-navy-600 border border-navy-500 px-3 py-2 active:opacity-80">
                      <Text className="text-ink text-sm">{d}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
