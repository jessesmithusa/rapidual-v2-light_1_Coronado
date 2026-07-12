import { useMemo, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card, Button } from "@rapidual/ui";
import { currency } from "@rapidual/utils";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { productById } from "@/mock/catalog";
import { RETAIL_PARTNERS } from "@/mock/retail-partners";
import { useCart } from "@/store/cart";
import { presentCartPayment, type CartChargeLine } from "@/lib/payments";
import { useActivity } from "@/store/activity";
import { useLoyalty } from "@/store/loyalty";

const partnerName = (id: string) => RETAIL_PARTNERS.find((p) => p.id === id)?.name ?? "Store";

export default function Cart() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const dec = useCart((s) => s.dec);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.subtotal)();
  const earn = useLoyalty((s) => s.earn);
  const [placed, setPlaced] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // group line items by retailer
  const groups = useMemo(() => {
    const byRetailer: Record<string, { id: string; qty: number }[]> = {};
    for (const [id, qty] of Object.entries(items)) {
      const p = productById(id);
      if (!p) continue;
      (byRetailer[p.retailerId] ??= []).push({ id, qty });
    }
    return byRetailer;
  }, [items]);

  const checkout = async () => {
    setPaying(true);
    setPayError(null);
    const lines: CartChargeLine[] = Object.entries(items).map(([id, qty]) => {
      const p = productById(id)!;
      return { productId: p.id, retailerId: p.retailerId, name: p.name, qty, unitPriceCents: Math.round(p.price * 100) };
    });
    const res = await presentCartPayment(lines); // real PaymentSheet when live, simulated otherwise
    setPaying(false);
    if (!res.ok) {
      setPayError(res.message);
      return;
    }
    earn(Math.round(subtotal * 10), "retail order");
    clear();
    setPlaced(true);
    void useActivity.getState().hydrate(); // pull the new order into the feed
    setTimeout(() => router.back(), 1200);
  };

  if (placed) {
    return (
      <SafeAreaView className="flex-1 bg-navy-900">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-success/15 items-center justify-center">
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text variant="title" className="mt-4 text-center">Order placed!</Text>
          <Text variant="label" className="mt-1 text-center">It'll ride your next laundry route — no extra trip.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const empty = Object.keys(groups).length === 0;

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="heading" className="ml-2">Cart</Text>
      </View>

      {empty ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cart-outline" size={40} color={colors.inkFaint} />
          <Text variant="label" className="mt-3">Your cart is empty</Text>
          <Text variant="caption" className="mt-1 text-center">Link a retailer and add items — they'll ride your laundry route.</Text>
          <Button title="Browse retailers" variant="secondary" className="mt-5" onPress={() => router.back()} />
        </View>
      ) : (
        <>
          <ScrollView className="flex-1 px-5" contentContainerClassName="pb-40" showsVerticalScrollIndicator={false}>
            {Object.entries(groups).map(([retailerId, lines]) => (
              <View key={retailerId} className="mt-4">
                <Text variant="label" className="mb-2">{partnerName(retailerId)}</Text>
                <Card>
                  {lines.map((l, i) => {
                    const p = productById(l.id)!;
                    return (
                      <View key={l.id} className={`flex-row items-center py-3 ${i > 0 ? "border-t border-navy-600/60" : ""}`}>
                        <View className="flex-1">
                          <Text variant="body" className="text-sm">{p.name}</Text>
                          <Text variant="caption" className="mt-0.5">{currency(p.price)} each</Text>
                        </View>
                        <View className="flex-row items-center mr-3">
                          <Pressable onPress={() => dec(l.id)} className="w-7 h-7 rounded-full bg-navy-600 border border-navy-500 items-center justify-center"><Ionicons name="remove" size={16} color={colors.ink} /></Pressable>
                          <Text variant="body" className="w-7 text-center text-sm">{l.qty}</Text>
                          <Pressable onPress={() => add(l.id)} className="w-7 h-7 rounded-full bg-orange-500 items-center justify-center"><Ionicons name="add" size={16} color="#FFFFFF" /></Pressable>
                        </View>
                        <Text variant="body" className="w-16 text-right text-sm">{currency(p.price * l.qty)}</Text>
                      </View>
                    );
                  })}
                </Card>
              </View>
            ))}

            <Card className="mt-5 flex-row items-start">
              <Ionicons name="repeat" size={20} color={colors.orange} />
              <Text variant="caption" className="ml-3 flex-1 leading-5">One cart across every linked store. Delivered on your next laundry route — no separate trips, no extra delivery fees.</Text>
            </Card>
          </ScrollView>

          <View className="absolute left-0 right-0 bottom-0 px-5 pb-7 pt-3 bg-navy-900 border-t border-navy-700">
            <View className="flex-row justify-between mb-3">
              <Text variant="heading">Subtotal</Text>
              <Text variant="heading" className="text-orange-400">{currency(subtotal)}</Text>
            </View>
            {payError ? <Text variant="caption" className="text-orange-400 mb-2 text-center">{payError}</Text> : null}
            <Button title={paying ? "Processing…" : "Checkout · ride my laundry route"} disabled={paying} onPress={checkout} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
