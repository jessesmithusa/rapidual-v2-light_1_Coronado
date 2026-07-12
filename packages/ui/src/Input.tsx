import { View, TextInput, type TextInputProps } from "react-native";
import { Text } from "./Text";

export function Input({
  label,
  error,
  className = "",
  ...rest
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View className={`mb-4 ${className}`}>
      {label ? (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#9AA0AB"
        selectionColor="#FF6B2C"
        className={`rounded-2xl bg-navy-700 border px-4 py-4 text-ink text-base ${
          error ? "border-danger" : "border-navy-600/60"
        }`}
        {...rest}
      />
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
