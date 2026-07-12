import { useEffect, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, Card, Badge } from "@rapidual/ui";
import { currency } from "@rapidual/utils";
import type { WardrobeItem } from "@rapidual/shared";
import { colors } from "@/theme/tokens";
import { fetchWardrobe, rankForProfile } from "@/lib/wardrobe";
import { DEFAULT_PREFERENCES } from "@/lib/defaults";

const ICON: Record<WardrobeItem["category"], keyof typeof Ionicons.glyphMap> = {
  basics: "shirt",
  tops: "shirt",
  bottoms: "browsers",
  outerwear: "snow",
  care: "sparkles",
};

export default function Wardrobe() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchWardrobe().then((list) => setItems(rankForProfile(list, DEFAULT_PREFERENCES)));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text variant="heading" className="ml-2">Wardrobe</Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        <Text variant="title">Recommended for you</Text>
        <Text variant="label" className="mt-1 mb-1 leading-6">
          Picked from your wash profile — and delivered on your next laundry route. No extra trip.
        </Text>
        <Badge label="Closed-Loop Commerce" tone="orange" />

        {notice ? (
          <View className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-3 mt-4">
            <Text variant="caption" className="text-orange-400">{notice}</Text>
          </View>
        ) : null}

        <View className="gap-3 mt-5">
          {items.map((it) => (
            <Card key={it.id} className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl bg-orange-500/15 items-center justify-center">
                <Ionicons name={ICON[it.category]} size={24} color={colors.orange} />
              </View>
              <View className="flex-1 ml-4">
                <Text variant="heading" className="text-base">{it.title}</Text>
                <Text variant="caption" className="mt-0.5">{it.reason}</Text>
                <View className="flex-row items-center mt-1.5">
                  {it.partner ? <Text variant="caption" className="text-ink-muted">{it.partner}</Text> : null}
                  {it.priceFrom ? <Text variant="caption" className="text-ink-muted"> · from {currency(it.priceFrom)}</Text> : null}
                </View>
              </View>
              <Pressable
                onPress={() => setNotice(`Added "${it.title}" to your next delivery (simulated — connect commerce to charge).`)}
                className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center active:opacity-80"
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </Pressable>
            </Card>
          ))}
        </View>

        <Card className="mt-6 flex-row items-start">
          <Ionicons name="repeat" size={20} color={colors.orange} />
          <Text variant="caption" className="ml-3 flex-1 leading-5">
            Items ride the route that's already coming to you. Pickups, re-deliveries, and your
            wardrobe — one loaded trip.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
