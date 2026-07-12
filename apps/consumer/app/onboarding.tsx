import { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen, Text, Button, Input, Card } from "@rapidual/ui";
import { colors } from "@/theme/tokens";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/store/session";

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "bag-handle", title: "We pick up", body: "Leave your bag out on your route day — no waiting around." },
  { icon: "sparkles", title: "We wash at WashHQ", body: "Wash, dry, fold to your preferences. Chain-of-custody photos at each step." },
  { icon: "home", title: "We re-deliver", body: "Folded and back on your doorstep — tracked live the whole way." },
];

export default function Onboarding() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const [fullName, setFullName] = useState(
    (user?.user_metadata?.full_name as string | undefined) ?? "",
  );
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async () => {
    setError(null);
    if (!user) {
      router.replace("/(tabs)");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq("id", user.id);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <Screen scroll>
      <View className="pt-12 pb-6">
        <Text variant="title">How Rapidual works</Text>
        <Text variant="label" className="mt-2">
          Three steps, every week. Skip or pause whenever you need.
        </Text>
      </View>

      <View className="gap-3">
        {STEPS.map((s, i) => (
          <Card key={s.title} className="flex-row items-center">
            <View className="w-11 h-11 rounded-2xl bg-orange-500/15 items-center justify-center">
              <Ionicons name={s.icon} size={22} color={colors.orange} />
            </View>
            <View className="flex-1 ml-4">
              <Text variant="heading">
                {i + 1}. {s.title}
              </Text>
              <Text variant="label" className="mt-0.5 leading-5">
                {s.body}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      <View className="mt-8">
        <Text variant="heading" className="mb-3">
          Finish your profile
        </Text>
        <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Alex Rivera" autoCapitalize="words" />
        <Input
          label="Phone (for delivery updates)"
          value={phone}
          onChangeText={setPhone}
          placeholder="(714) 555-0142"
          keyboardType="phone-pad"
          inputMode="tel"
        />
        {error ? <Text className="text-danger text-sm mb-3">{error}</Text> : null}
        <Button title="Enter Rapidual" loading={loading} onPress={onFinish} />
      </View>
    </Screen>
  );
}
