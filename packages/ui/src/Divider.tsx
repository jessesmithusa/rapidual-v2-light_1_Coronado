import { View } from "react-native";
import { Text } from "./Text";

export function Divider({ label }: { label?: string }) {
  return (
    <View className="flex-row items-center my-5">
      <View className="flex-1 h-px bg-navy-600" />
      {label ? (
        <Text variant="caption" className="mx-3 uppercase tracking-widest">
          {label}
        </Text>
      ) : null}
      <View className="flex-1 h-px bg-navy-600" />
    </View>
  );
}
