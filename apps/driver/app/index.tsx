import { View, ActivityIndicator } from "react-native";
import { Text } from "@rapidual/ui";
import { colors } from "@/theme/tokens";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-navy-900">
      <Text variant="title" className="text-orange-500">Rapidual Driver</Text>
      <ActivityIndicator color={colors.orange} className="mt-4" />
    </View>
  );
}
