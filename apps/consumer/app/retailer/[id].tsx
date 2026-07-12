import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card } from "@rapidual/ui";
import { currency } from "@rapidual/utils";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/theme/tokens";
import { RETAIL_PARTNERS } from "@/mock/retail-partners";
import { productsFor } from "@/mock/catalog";
import { useCart } from "@/store/cart";

export default function Retailer() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const partner = RETAIL_PARTNERS.find((p) => p.id === id);
  const products = productsFor(String(id));
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const dec = useCart((s) => s.dec);
  const count = useCart((s) => s.count)();
  const subtotal = useCart((s) => s.subtotal)();

  if (!partner) {
    return (
      <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
        <Text variant="label" className="p-5">Retailer not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <View className="w-9 h-9 rounded-xl items-center justify-center ml-2" style={{ backgroundColor: partner.accent + "22" }}>
          <Text className="font-extrabold text-xs" style={{ color: partner.accent }}>{partner.short}</Text>
        </View>
        <Text variant="heading" className="ml-2 flex-1">{partner.name}</Text>
        <Pressable onPress={() => router.push("/cart")} hitSlop={12}>
          <Ionicons name="cart" size={24} color={colors.ink} />
          {count > 0 ? (
            <View className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-orange-500 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">{count}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-28" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-1">
          <Ionicons name="star" size={13} color={colors.orange} />
          <Text variant="caption" className="ml-1">{partner.rating.toFixed(1)} · {partner.category} · {partner.etaMinutes} min · min {currency(partner.minOrder)}</Text>
        </View>
        {partner.deal ? <Text variant="caption" className="text-orange-400 mb-2">{partner.deal}</Text> : null}

        <View className="gap-2.5 mt-3">
          {products.map((p) => {
            const qty = items[p.id] ?? 0;
            return (
              <Card key={p.id} className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-navy-600 items-center justify-center">
                  <Ionicons name={p.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.inkMuted} />
                </View>
                <View className="flex-1 ml-3">
                  <Text variant="body" className="text-sm">{p.name}</Text>
                  <Text variant="heading" className="text-base mt-0.5">{currency(p.price)}</Text>
                </View>
                {qty === 0 ? (
                  <Pressable onPress={() => add(p.id)} className="rounded-full bg-orange-500 px-4 py-2 active:opacity-80">
                    <Text className="text-white font-bold text-xs">Add</Text>
                  </Pressable>
                ) : (
                  <View className="flex-row items-center">
                    <Pressable onPress={() => dec(p.id)} className="w-8 h-8 rounded-full bg-navy-600 border border-navy-500 items-center justify-center"><Ionicons name="remove" size={18} color={colors.ink} /></Pressable>
                    <Text variant="body" className="w-7 text-center">{qty}</Text>
                    <Pressable onPress={() => add(p.id)} className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center"><Ionicons name="add" size={18} color="#FFFFFF" /></Pressable>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {count > 0 ? (
        <View className="absolute left-0 right-0 bottom-0 px-5 pb-7 pt-3 bg-navy-900 border-t border-navy-700">
          <Pressable onPress={() => router.push("/cart")} className="flex-row items-center justify-between rounded-2xl bg-orange-500 px-5 py-3.5 active:opacity-90">
            <Text className="text-white font-bold">View cart · {count} item{count === 1 ? "" : "s"}</Text>
            <Text className="text-white font-bold">{currency(subtotal)}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
