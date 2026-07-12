import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button } from "@rapidual/ui";
import { colors } from "@/theme/tokens";
import { useRouter, type Href } from "expo-router";
import { useSession } from "@/store/session";
import { useLoyalty } from "@/store/loyalty";
import { useImpact } from "@/store/impact";
import { lifetimeSavings, currency } from "@rapidual/utils";
import { signOut } from "@/lib/auth";

const ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string; href?: Href }[] = [
  { icon: "star", label: "Rapid Points & Rewards", href: "/rewards" },
  { icon: "gift", label: "Refer friends & earn", href: "/refer" },
  { icon: "chatbubbles", label: "Chat support", href: "/chat" },
  { icon: "repeat", label: "Standing pickup", href: "/recurring" },
  { icon: "time", label: "Order history", href: "/(tabs)/activity" },
  { icon: "card", label: "Payment methods", href: "/payment-methods" },
  { icon: "notifications", label: "Notifications", href: "/notifications" },
  { icon: "location", label: "Addresses" },
  { icon: "trash", label: "Delete account", href: "/delete-account" },
];

export default function Profile() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const points = useLoyalty((s) => s.points);
  const impact = lifetimeSavings(useImpact((s) => s.bags));
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "Your account";

  return (
    <Screen scroll>
      <Text variant="title" className="pt-2 mb-5">Profile</Text>

      <Card elevated className="flex-row items-center">
        <View className="w-14 h-14 rounded-full bg-orange-500/15 items-center justify-center">
          <Text variant="title" className="text-orange-400">{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View className="flex-1 ml-4">
          <Text variant="heading">{name}</Text>
          <Text variant="caption" className="mt-0.5">{user?.email}</Text>
        </View>
        <View className="items-end">
          <Text variant="heading" className="text-orange-400">{points.toLocaleString()}</Text>
          <Text variant="caption">points</Text>
        </View>
      </Card>

      <Pressable onPress={() => router.push("/impact")} className="active:opacity-80">
        <Card className="mt-3 flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-success/15 items-center justify-center">
            <Ionicons name="leaf" size={20} color={colors.success} />
          </View>
          <View className="flex-1 ml-3">
            <Text variant="heading" className="text-base">Your impact</Text>
            <Text variant="caption" className="mt-0.5">{currency(impact.value)} saved · {impact.gallons.toLocaleString()} gal water</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Card>
      </Pressable>

      <View className="mt-3 rounded-2xl bg-navy-700 border border-navy-600/60 overflow-hidden">
        {ROWS.map((r, i) => (
          <Pressable
            key={r.label}
            disabled={!r.href}
            onPress={() => r.href && router.push(r.href)}
            className={`flex-row items-center px-4 py-4 active:bg-navy-600/40 ${i > 0 ? "border-t border-navy-600/60" : ""}`}
          >
            <Ionicons name={r.icon} size={20} color={colors.inkMuted} />
            <Text variant="body" className="flex-1 ml-3">{r.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </Pressable>
        ))}
      </View>

      <Button title="Sign out" variant="secondary" className="mt-6" onPress={() => signOut()} />
      <Text variant="caption" className="text-center mt-3">Introductory pricing · $7 per bag.</Text>
    </Screen>
  );
}
