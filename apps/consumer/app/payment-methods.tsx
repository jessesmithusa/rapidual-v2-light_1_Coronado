import { useState } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button } from "@rapidual/ui";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { useWallet } from "@/store/wallet";

const brandIcon: Record<string, keyof typeof Ionicons.glyphMap> = { Visa: "card", Mastercard: "card", Amex: "card" };

export default function PaymentMethods() {
  const router = useRouter();
  const { cards, live, busy, addCard, makeDefault, remove } = useWallet();
  const [note, setNote] = useState<string | null>(null);

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Payment methods</Text>
      </View>

      {cards.map((c) => (
        <Card key={c.id} className="mb-3 flex-row items-center">
          <View className="w-11 h-11 rounded-xl bg-navy-600 items-center justify-center"><Ionicons name={brandIcon[c.brand] ?? "card"} size={22} color={colors.ink} /></View>
          <View className="flex-1 ml-3">
            <Text variant="heading" className="text-base">{c.brand} •••• {c.last4}</Text>
            <Text variant="caption" className="mt-0.5">Exp {c.exp}</Text>
          </View>
          {c.isDefault ? (
            <View className="rounded-full bg-success/15 px-3 py-1"><Text className="text-success text-xs font-semibold">Default</Text></View>
          ) : (
            <Pressable onPress={() => makeDefault(c.id)} className="mr-3"><Text variant="caption" className="text-orange-400">Default</Text></Pressable>
          )}
          {!c.isDefault ? <Pressable onPress={() => remove(c.id)} hitSlop={8}><Ionicons name="trash-outline" size={20} color={colors.inkFaint} /></Pressable> : null}
        </Card>
      ))}

      <Button
        title={busy ? "Opening secure sheet…" : "Add payment method"}
        variant="secondary"
        className="mt-2"
        disabled={busy}
        onPress={async () => {
          const res = await addCard(); // Stripe PaymentSheet in setup mode when live
          setNote(res.message);
        }}
      />
      {note ? (
        <View className="rounded-xl bg-navy-700 border border-navy-600/60 p-3 mt-3 flex-row items-start">
          <Ionicons name="shield-checkmark" size={18} color={colors.success} />
          <Text variant="caption" className="ml-3 flex-1 leading-5">{note}</Text>
        </View>
      ) : null}
      <Text variant="caption" className="mt-3 text-center text-ink-faint">
        {live ? "Cards are stored by Stripe — Rapidual never sees the numbers." : "Sample cards shown — connect Stripe to manage real ones."}
      </Text>
    </Screen>
  );
}
