import { View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Screen, Text, Button, Badge, Divider } from "@rapidual/ui";
import { SocialButtons } from "@/components/SocialButtons";

export default function Welcome() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen scroll>
      <View className="flex-1 justify-center pt-16">
        <Badge label="Orange County · Now serving" tone="orange" />
        <Text variant="display" className="mt-5">
          Laundry that{"\n"}rides the{" "}
          <Text variant="display" className="text-orange-500">
            same route.
          </Text>
        </Text>
        <Text variant="label" className="mt-3 leading-6">
          Per-bag wash-dry-fold with live tracking and chain-of-custody photos —
          delivered on routes that run 94%+ full both directions. No subscription.
        </Text>

        <View className="flex-row gap-3 mt-8">
          {[
            { k: "From", v: "$7/bag" },
            { k: "Utilization", v: "94%+" },
            { k: "Tracking", v: "Live" },
          ].map((s) => (
            <View key={s.k} className="flex-1 rounded-2xl bg-navy-700 border border-navy-600/60 p-4">
              <Text variant="caption">{s.k.toUpperCase()}</Text>
              <Text variant="heading" className="text-orange-400 mt-1">
                {s.v}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-10">
        <Button title="Create account" onPress={() => router.push("/(auth)/signup")} />
        <Button
          title="I already have an account"
          variant="ghost"
          className="mt-1"
          onPress={() => router.push("/(auth)/login")}
        />

        <Divider label="or" />
        <SocialButtons onError={setError} />
        {error ? <Text className="text-danger text-xs text-center mt-1">{error}</Text> : null}
      </View>
    </Screen>
  );
}
