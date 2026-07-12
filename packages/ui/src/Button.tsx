import { Pressable, ActivityIndicator, type PressableProps } from "react-native";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost";

const BASE = "flex-row items-center justify-center rounded-full px-5 py-4 active:opacity-80";
const VARIANT: Record<Variant, string> = {
  primary: "bg-orange-500",
  secondary: "bg-navy-600 border border-navy-500",
  ghost: "bg-transparent",
};
const LABEL: Record<Variant, string> = {
  primary: "text-white font-bold text-base",
  secondary: "text-ink font-semibold text-base",
  ghost: "text-orange-500 font-semibold text-base",
};

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  ...rest
}: PressableProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      className={`${BASE} ${VARIANT[variant]} ${off ? "opacity-50" : ""} ${className}`}
      disabled={off}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#FF6B2C"} />
      ) : (
        <Text className={LABEL[variant]}>{title}</Text>
      )}
    </Pressable>
  );
}
