import { useMemo, useState } from "react";
import { View, ScrollView, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Badge } from "@rapidual/ui";
import { currency } from "@rapidual/utils";
import { colors } from "@/theme/tokens";
import { RETAIL_PARTNERS, PARTNER_CATEGORIES } from "@/mock/retail-partners";
import { useRetail } from "@/store/retail";
import { useCart } from "@/store/cart";

export default function Marketplace() {
  const router = useRouter();
  const linked = useRetail((s) => s.linked);
  const toggle = useRetail((s) => s.toggle);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const cartCount = useCart((s) => s.count)();

  const available = RETAIL_PARTNERS.filter((p) => p.available);
  const linkedCount = available.filter((p) => linked[p.id]).length;

  const results = useMemo(() => {
    const filtered = available.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (query.trim() === "" || `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())),
    );
    // linked stores surface first
    return [...filtered].sort((a, b) => Number(!!linked[b.id]) - Number(!!linked[a.id]));
  }, [query, cat, linked]);

  const deals = available.filter((p) => p.deal);

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-28" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between pt-2">
        <Text variant="title">Marketplace</Text>
        <Pressable onPress={() => router.push("/cart")} hitSlop={12}>
          <Ionicons name="cart" size={24} color={colors.ink} />
          {cartCount > 0 ? (
            <View className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-orange-500 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">{cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <Text variant="label" className="mt-1 mb-4">Same-day from stores 5–10 miles away — riding your laundry route</Text>

      <View className="flex-row items-center rounded-2xl bg-navy-700 border border-navy-600/60 px-4 py-3">
        <Ionicons name="search" size={18} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search retailers or products..."
          placeholderTextColor={colors.inkFaint}
          style={{ flex: 1, marginLeft: 10, color: colors.ink, fontSize: 15 }}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 -mx-5 px-5">
        {PARTNER_CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCat(c)}
            className={`rounded-full px-4 py-2 mr-2 ${c === cat ? "bg-orange-500" : "bg-navy-700 border border-navy-600/60"}`}
          >
            <Text className={c === cat ? "text-white font-semibold" : "text-ink-muted"}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {linkedCount > 0 ? (
        <Text variant="caption" className="mt-4">{linkedCount} linked retailer{linkedCount === 1 ? "" : "s"} · deals from your stores</Text>
      ) : null}

      <Text variant="heading" className="mt-5 mb-3">Featured Deals</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
        {deals.map((p) => (
          <Card key={p.id} className="w-64 mr-3" style={{ borderLeftWidth: 3, borderLeftColor: p.accent }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold tracking-wider" style={{ color: p.accent }}>{p.category.toUpperCase()}</Text>
              {linked[p.id] ? <Badge label="Linked" tone="success" /> : null}
            </View>
            <Text variant="heading" className="mt-2 text-base">{p.deal}</Text>
            <Text variant="caption" className="mt-1">{p.name}</Text>
          </Card>
        ))}
      </ScrollView>

      <Pressable onPress={() => router.push("/link-accounts")}>
        <Card elevated className="mt-6 flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-orange-500/15 items-center justify-center">
            <Ionicons name="link" size={20} color={colors.orange} />
          </View>
          <View className="flex-1 ml-3">
            <Text variant="heading" className="text-base">Link Your Retail Accounts</Text>
            <Text variant="caption" className="mt-0.5">{linkedCount} of {available.length} linked · for Rapid free delivery</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Card>
      </Pressable>

      <Text variant="heading" className="mt-6 mb-3">Retailers</Text>
      {results.map((p) => {
        const on = !!linked[p.id];
        return (
          <Pressable key={p.id} onPress={() => router.push(`/retailer/${p.id}`)} className="active:opacity-90">
          <Card className={`mb-3 ${on ? "border-success/40" : ""}`}>
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: p.accent + "22" }}>
                <Text className="font-extrabold" style={{ color: p.accent }}>{p.short}</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text variant="heading" className="text-base">{p.name}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={13} color={colors.orange} />
                  <Text variant="caption" className="ml-1">{p.rating.toFixed(1)} · {p.category}</Text>
                  <View className="flex-row items-center ml-2">
                    <Ionicons name="flash" size={12} color={colors.success} />
                    <Text variant="caption" className="text-success ml-0.5 font-medium">Arrives today</Text>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={() => toggle(p.id)}
                className={`rounded-full px-3 py-1.5 ${on ? "bg-navy-600 border border-navy-500" : "bg-orange-500"}`}
              >
                <Text className={`text-xs font-semibold ${on ? "text-ink-muted" : "text-white"}`}>{on ? "Linked" : "Link"}</Text>
              </Pressable>
            </View>
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-navy-600/60">
              <Text variant="caption">Min. order {currency(p.minOrder)}</Text>
              {p.deal ? <Badge label={p.deal} tone="orange" /> : <View />}
              <Text variant="caption" className="text-orange-400 font-bold">Shop →</Text>
            </View>
          </Card>
          </Pressable>
        );
      })}

      {/* Anchor targets — coming soon */}
      <Text variant="heading" className="mt-4 mb-3">Coming soon</Text>
      <View className="flex-row gap-2 flex-wrap">
        {RETAIL_PARTNERS.filter((p) => !p.available).map((p) => (
          <View key={p.id} className="flex-row items-center rounded-full bg-navy-600 px-3 py-2">
            <Text className="font-extrabold text-xs mr-1.5" style={{ color: p.accent }}>{p.short}</Text>
            <Text variant="caption" className="text-ink-muted font-medium">{p.name}</Text>
          </View>
        ))}
      </View>
      </ScrollView>

      {/* Sticky cart pill */}
      {cartCount > 0 ? (
        <Pressable
          onPress={() => router.push("/cart")}
          className="absolute bottom-5 left-5 right-5 flex-row items-center justify-between rounded-full bg-[#17181C] px-5 py-4 active:opacity-90"
        >
          <View className="w-6 h-6 rounded-full bg-orange-500 items-center justify-center">
            <Text className="text-white text-xs font-bold">{cartCount}</Text>
          </View>
          <Text className="text-white font-bold text-base">View cart</Text>
          <Text className="text-white/80 font-semibold">{currency(useCart.getState().subtotal())}</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}
