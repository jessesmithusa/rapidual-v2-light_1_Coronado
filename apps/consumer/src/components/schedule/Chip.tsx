import { Pressable } from "react-native";
import { Text } from "@rapidual/ui";

export function Chip({
  label,
  selected,
  onPress,
  className = "",
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2.5 rounded-full border active:opacity-80 ${
        selected ? "bg-orange-500 border-orange-500" : "bg-navy-700 border-navy-600"
      } ${className}`}
    >
      <Text className={selected ? "text-white font-semibold" : "text-ink"}>{label}</Text>
    </Pressable>
  );
}
