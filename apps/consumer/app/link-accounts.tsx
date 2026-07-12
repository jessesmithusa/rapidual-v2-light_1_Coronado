import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text } from "@rapidual/ui";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { RETAIL_PARTNERS } from "@/mock/retail-partners";
import { useRetail } from "@/store/retail";

export default function LinkAccounts() {
  const router = useRouter();
  const linked = useRetail((s) => s.linked);
  const toggle = useRetail((s) => s.toggle);
  const count = Object.values(linked).filter(Boolean).length;

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Link Retail Accounts</Text>
      </View>

      <Text className="text-success font-semibold text-center text-lg mt-4">For Rapid Free Delivery</Text>
      <View className="h-px bg-navy-600/70 my-4" />
      <Text variant="label" className="text-center">Available in your area now!</Text>

      <View className="flex-row flex-wrap justify-between mt-5">
        {RETAIL_PARTNERS.map((p) => {
          const on = linked[p.id];
          const disabled = !p.available;
          return (
            <Pressable
              key={p.id}
              disabled={disabled}
              onPress={() => toggle(p.id)}
              className="w-[23%] items-center mb-4"
              style={{ opacity: disabled ? 0.4 : 1 }}
            >
              <View
                className="w-full aspect-square rounded-2xl items-center justify-center border"
                style={{ backgroundColor: p.accent + (on ? "26" : "14"), borderColor: on ? p.accent : "#1B2748" }}
              >
                <Text className="font-extrabold text-base" style={{ color: p.accent }}>{p.short}</Text>
                {on ? (
                  <View className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-success items-center justify-center">
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <Text variant="caption" className="mt-1.5 text-center" numberOfLines={1}>{p.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="rounded-2xl bg-navy-700 border border-navy-600/60 p-4 flex-row items-center mt-2">
        <Ionicons name="shield-checkmark" size={20} color={colors.success} />
        <Text variant="caption" className="ml-3 flex-1 leading-5">
          {count} account{count === 1 ? "" : "s"} linked. Your retail orders ride the same route as your laundry — protected payments and secure account linking.
        </Text>
      </View>
    </Screen>
  );
}
