import { useEffect, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Text, Card } from "@rapidual/ui";
import { currency, predictPickup, bagTierPrice } from "@rapidual/utils";
import { colors } from "@/theme/tokens";
import { useSession } from "@/store/session";
import { MOCK_ADDRESSES } from "@/mock/addresses";
import { RETAIL_PARTNERS } from "@/mock/retail-partners";
import { useLoyalty } from "@/store/loyalty";
import { useRecurring } from "@/store/recurring";
import { useNotifications } from "@/store/notifications";
import { useActivity } from "@/store/activity";
import { PICKUP_HISTORY } from "@/mock/history";
import { fetchPickupHistory } from "@/data/repo";

/** Service categories — the DoorDash-style icon row. */
const SERVICES: { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href; tint: string }[] = [
  { label: "Laundry", icon: "shirt", href: "/schedule", tint: "#FF6B2C" },
  { label: "Marketplace", icon: "storefront", href: "/marketplace", tint: "#0E9F6E" },
  { label: "Standing Pickup", icon: "repeat", href: "/recurring", tint: "#2563EB" },
  { label: "Rewards", icon: "gift", href: "/rewards", tint: "#DB2777" },
];

const DAYL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const firstName = ((user?.user_metadata?.full_name as string | undefined) ?? "").split(" ")[0] || "there";

  const unread = useNotifications((s) => s.items.filter((n) => !n.read).length);
  const points = useLoyalty((s) => s.points);
  const recurringActive = useRecurring((s) => s.active);
  const recurringDay = useRecurring((s) => s.weekday);
  const activity = useActivity((s) => s.items);
  const inFlight = activity.find((a) => a.status === "in_progress");
  const lastLaundry = activity.find((a) => a.kind === "laundry" && a.status === "completed");

  const [history, setHistory] = useState(PICKUP_HISTORY);
  useEffect(() => { void fetchPickupHistory().then((h) => h && setHistory(h)); }, []);
  const pred = predictPickup(history);

  const home = MOCK_ADDRESSES[0]!;
  const pilotPartners = RETAIL_PARTNERS.filter((p) => p.available);

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        {/* ── Deliver-to pill + bell (the Uber Eats header) ── */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
          <Pressable onPress={() => router.push("/schedule")} className="flex-row items-center active:opacity-70">
            <Text variant="caption" className="text-ink-muted mr-1">Pickup at</Text>
            <Text variant="body" className="font-bold">{home.label}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.ink} style={{ marginLeft: 2 }} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/notifications")}
            className="w-10 h-10 rounded-full bg-navy-600 items-center justify-center"
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.ink} />
            {unread > 0 ? (
              <View className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-orange-500 items-center justify-center">
                <Text className="text-white text-[10px] font-bold">{unread}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* ── Search bar ── */}
        <Pressable
          onPress={() => router.push("/marketplace")}
          className="mx-5 mb-4 flex-row items-center rounded-full bg-navy-600 px-4 py-3.5 active:opacity-80"
        >
          <Ionicons name="search" size={18} color={colors.inkMuted} />
          <Text variant="body" className="text-ink-faint ml-2">Search Target, Home Depot, laundry…</Text>
        </Pressable>

        {/* ── Service chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-5 pb-1">
          {SERVICES.map((s) => (
            <Pressable key={s.label} onPress={() => router.push(s.href)} className="items-center w-[68px] active:opacity-70">
              <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: `${s.tint}14` }}>
                <Ionicons name={s.icon} size={24} color={s.tint} />
              </View>
              <Text variant="caption" className="text-ink mt-1.5 text-center font-medium" numberOfLines={2}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Greeting ── */}
        <View className="px-5 mt-4">
          <Text variant="title" className="text-[26px]">{greeting()}, {firstName}</Text>
        </View>

        {/* ── In-flight order banner ── */}
        {inFlight ? (
          <Pressable onPress={() => router.push(inFlight.kind === "laundry" ? "/track" : "/activity")} className="mx-5 mt-4 active:opacity-90">
            <Card className="flex-row items-center border-orange-500/40">
              <View className="w-11 h-11 rounded-full bg-orange-500 items-center justify-center">
                <Ionicons name={inFlight.kind === "laundry" ? "shirt" : "cube"} size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1 ml-3">
                <Text variant="heading" className="text-base">{inFlight.title} is on the way</Text>
                <Text variant="caption" className="text-ink-muted mt-0.5">{inFlight.subtitle} · {inFlight.date}</Text>
              </View>
              <View className="flex-row items-center">
                <Text variant="label" className="text-orange-400 font-bold mr-1">Track</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.orange400} />
              </View>
            </Card>
          </Pressable>
        ) : null}

        {/* ── Predicted pickup (smart banner) ── */}
        <Pressable onPress={() => router.push("/schedule")} className="mx-5 mt-4 active:opacity-90">
          <Card>
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-2xl bg-navy-600 items-center justify-center">
                <Ionicons name="calendar" size={20} color={colors.orange400} />
              </View>
              <View className="flex-1 ml-3">
                <Text variant="heading" className="text-base">
                  {recurringActive ? `Standing pickup ${DAYL[recurringDay]}` : `You usually order ${DAYL[pred.weekday]}s`}
                </Text>
                <Text variant="caption" className="text-ink-muted mt-0.5">
                  {recurringActive ? "We'll be there — add bags anytime" : `${pred.bags} bags predicted · one tap to schedule`}
                </Text>
              </View>
              <View className="rounded-full bg-orange-500 px-4 py-2">
                <Text className="text-white font-bold text-sm">Schedule</Text>
              </View>
            </View>
          </Card>
        </Pressable>

        {/* ── Promo rail ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-3 mt-5">
          <Pressable onPress={() => router.push("/schedule")} className="active:opacity-90">
            <View className="w-[250px] rounded-2xl bg-orange-500 p-4">
              <Text className="text-white text-xl font-extrabold">$7 a bag.</Text>
              <Text className="text-white text-xl font-extrabold">No subscription.</Text>
              <Text className="text-white/80 text-xs mt-1.5">Falls to {currency(bagTierPrice(5))}/bag on 5+ · picked up at your door</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => router.push("/refer")} className="active:opacity-90">
            <View className="w-[250px] rounded-2xl bg-[#17181C] p-4">
              <Text className="text-white text-xl font-extrabold">Give $7, get $7</Text>
              <Text className="text-white/70 text-xs mt-1.5">One free bag for you and every friend who tries Rapidual</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => router.push("/marketplace")} className="active:opacity-90">
            <View className="w-[250px] rounded-2xl bg-[#0E9F6E] p-4">
              <Text className="text-white text-xl font-extrabold">Same-day, from stores near you</Text>
              <Text className="text-white/80 text-xs mt-1.5">Your order rides the laundry route — 5 to 10 miles, not 50</Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* ── Order again ── */}
        {lastLaundry ? (
          <View className="px-5 mt-6">
            <Text variant="heading">Order again</Text>
            <Pressable onPress={() => router.push("/schedule")} className="mt-3 active:opacity-90">
              <Card className="flex-row items-center">
                <View className="w-11 h-11 rounded-2xl bg-navy-600 items-center justify-center">
                  <Ionicons name="refresh" size={20} color={colors.ink} />
                </View>
                <View className="flex-1 ml-3">
                  <Text variant="body" className="font-semibold">{lastLaundry.subtitle.split(" · ")[0]} · Laundry</Text>
                  <Text variant="caption" className="text-ink-muted mt-0.5">Last order {currency(lastLaundry.amount)} · {lastLaundry.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
              </Card>
            </Pressable>
          </View>
        ) : null}

        {/* ── Partner stores ── */}
        <View className="px-5 mt-6 flex-row items-center justify-between">
          <Text variant="heading">Stores on your route</Text>
          <Pressable onPress={() => router.push("/marketplace")} hitSlop={8}>
            <Text variant="label" className="text-orange-400 font-bold">See all</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-3 mt-3">
          {pilotPartners.map((p) => (
            <Pressable key={p.id} onPress={() => router.push(`/retailer/${p.id}`)} className="active:opacity-90">
              <View className="w-[150px] rounded-2xl bg-navy-700 border border-navy-500 p-3">
                <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: `${p.accent}18` }}>
                  <Text className="font-extrabold text-base" style={{ color: p.accent }}>{p.short}</Text>
                </View>
                <Text variant="body" className="font-semibold mt-2" numberOfLines={1}>{p.name}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="flash" size={12} color={colors.success} />
                  <Text variant="caption" className="text-success ml-1 font-medium">Arrives today</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Points strip ── */}
        <Pressable onPress={() => router.push("/rewards")} className="mx-5 mt-6 active:opacity-90">
          <View className="flex-row items-center rounded-2xl bg-navy-600 px-4 py-3">
            <Ionicons name="star" size={18} color={colors.orange400} />
            <Text variant="body" className="font-semibold ml-2 flex-1">{points.toLocaleString()} Rapid Points</Text>
            <Text variant="caption" className="text-ink-muted">Redeem</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
