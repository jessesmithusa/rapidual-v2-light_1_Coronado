import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card } from "@rapidual/ui";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/theme/tokens";
import { BagQR } from "@/components/BagQR";

export default function BagTags() {
  const router = useRouter();
  const { id, bags } = useLocalSearchParams<{ id: string; bags?: string }>();
  const n = Math.max(1, Number(bags ?? 3));
  const order = String(id ?? "ord");

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-2">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Bag tags</Text>
      </View>
      <Text variant="label" className="mb-4 leading-6">
        Each bag carries a code your driver scans at pickup, wash, fold, and delivery — so every bag is tracked end to end.
      </Text>

      {Array.from({ length: n }).map((_, i) => {
        const code = `${order.toUpperCase()}-B${i + 1}`;
        return (
          <Card key={i} className="mb-3 flex-row items-center">
            <View className="bg-navy-900 rounded-xl p-2"><BagQR value={code} size={88} /></View>
            <View className="flex-1 ml-4">
              <Text variant="heading">Bag {i + 1}</Text>
              <Text variant="caption" className="mt-1">{code}</Text>
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 rounded-full bg-success mr-1.5" />
                <Text variant="caption" className="text-success">Ready to tag</Text>
              </View>
            </View>
          </Card>
        );
      })}

      <Card className="mt-2 flex-row items-start">
        <Ionicons name="qr-code" size={20} color={colors.orange} />
        <Text variant="caption" className="ml-3 flex-1 leading-5">Print these or show them on your phone at pickup. Scans appear live on your tracking screen.</Text>
      </Card>
    </Screen>
  );
}
