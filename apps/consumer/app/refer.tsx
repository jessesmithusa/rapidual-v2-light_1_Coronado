import { useState } from "react";
import { View, Pressable, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button } from "@rapidual/ui";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { REFERRAL } from "@/mock/referral";

const STEPS = [
  { icon: "share-social", text: "Share your code with friends" },
  { icon: "bag-check", text: "They get their first bag free ($7 off)" },
  { icon: "gift", text: `You both get a free bag — $${REFERRAL.perReferral} credit each` },
];

export default function Refer() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await Share.share({ message: `Your first Rapidual bag is free ($7 off) with my code ${REFERRAL.code} — laundry + retail, delivered.` });
    } catch {
      // dismissed
    }
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Refer Friends & Earn</Text>
      </View>

      <Card elevated className="items-center py-6">
        <View className="w-14 h-14 rounded-full bg-orange-500/15 items-center justify-center">
          <Ionicons name="gift" size={28} color={colors.orange} />
        </View>
        <Text variant="heading" className="mt-3 text-center">Give $7, get $7</Text>
        <Text variant="caption" className="mt-1 text-center">when friends complete their first order</Text>

        <Text variant="caption" className="mt-5">YOUR REFERRAL CODE</Text>
        <Pressable
          onPress={() => setCopied(true)}
          className="flex-row items-center mt-2 rounded-2xl bg-navy-600 border border-dashed border-navy-400 px-5 py-3"
        >
          <Text variant="heading" className="tracking-widest">{REFERRAL.code}</Text>
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color={colors.orange} style={{ marginLeft: 10 }} />
        </Pressable>
        {copied ? <Text variant="caption" className="text-success mt-2">Copied!</Text> : null}
      </Card>

      <View className="flex-row gap-3 mt-3">
        <Card className="flex-1 items-center py-4">
          <Text variant="title" className="text-orange-400">{REFERRAL.friendsReferred}</Text>
          <Text variant="caption" className="mt-1">Friends Referred</Text>
        </Card>
        <Card className="flex-1 items-center py-4">
          <Text variant="title" className="text-orange-400">{`$${REFERRAL.creditEarned}`}</Text>
          <Text variant="caption" className="mt-1">Free-bag credit</Text>
        </Card>
        <Card className="flex-1 items-center py-4">
          <Text variant="title" className="text-orange-400">{REFERRAL.pendingInvites}</Text>
          <Text variant="caption" className="mt-1">Pending</Text>
        </Card>
      </View>

      <Pressable onPress={share}>
        <Card elevated className="mt-3 flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-orange-500/15 items-center justify-center"><Ionicons name="business" size={20} color={colors.orange} /></View>
          <View className="flex-1 ml-3">
            <Text variant="heading" className="text-base">Get your building on Rapidual</Text>
            <Text variant="caption" className="mt-0.5">14 neighbors already on your route — denser routes mean faster pickups for everyone.</Text>
          </View>
          <Ionicons name="share-social" size={18} color={colors.orange} />
        </Card>
      </Pressable>

      <Text variant="heading" className="mt-6 mb-3">How it works</Text>
      <Card>
        {STEPS.map((s, i) => (
          <View key={s.text} className={`flex-row items-center py-3 ${i > 0 ? "border-t border-navy-600/60" : ""}`}>
            <View className="w-8 h-8 rounded-full bg-orange-500/15 items-center justify-center">
              <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.orange} />
            </View>
            <Text variant="body" className="flex-1 ml-3 text-sm">{s.text}</Text>
          </View>
        ))}
      </Card>

      <Button title="Share with Friends" className="mt-6" onPress={share} />
    </Screen>
  );
}
