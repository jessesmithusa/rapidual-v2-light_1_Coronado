import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card } from "@rapidual/ui";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { useNotifications } from "@/store/notifications";
import { registerForPush } from "@/lib/notifications";

export default function Notifications() {
  const router = useRouter();
  const { enabled, items, setEnabled, markAllRead } = useNotifications();

  const toggle = async () => {
    if (!enabled) {
      await registerForPush();
      setEnabled(true);
    } else setEnabled(false);
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between pt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
          <Text variant="title">Notifications</Text>
        </View>
        <Pressable onPress={markAllRead}><Text variant="caption" className="text-orange-400">Mark all read</Text></Pressable>
      </View>

      <Card elevated className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-orange-500/15 items-center justify-center"><Ionicons name="notifications" size={20} color={colors.orange} /></View>
        <View className="flex-1 ml-3">
          <Text variant="heading" className="text-base">Push notifications</Text>
          <Text variant="caption" className="mt-0.5">Driver arrivals, ready alerts, pickup reminders</Text>
        </View>
        <Pressable onPress={toggle}><Ionicons name={enabled ? "toggle" : "toggle-outline"} size={40} color={enabled ? colors.orange : colors.inkFaint} /></Pressable>
      </Card>

      <View className="mt-4">
        {items.length === 0 ? (
          <Card className="items-center py-10"><Ionicons name="notifications-off-outline" size={32} color={colors.inkFaint} /><Text variant="caption" className="mt-3">No notifications yet</Text></Card>
        ) : (
          items.map((n) => (
            <Card key={n.id} className="mb-2.5 flex-row items-start">
              <View className="w-9 h-9 rounded-full bg-navy-600 items-center justify-center mt-0.5"><Ionicons name={n.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.orange} /></View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text variant="heading" className="text-sm flex-1">{n.title}</Text>
                  {!n.read ? <View className="w-2 h-2 rounded-full bg-orange-500 ml-2" /> : null}
                </View>
                <Text variant="caption" className="mt-0.5 leading-5">{n.body}</Text>
                <Text variant="caption" className="mt-1 text-ink-faint">{n.at}</Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
