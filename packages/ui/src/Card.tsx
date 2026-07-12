import { View, type ViewProps } from "react-native";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  elevated = false,
  ...rest
}: ViewProps & { children: ReactNode; elevated?: boolean }) {
  return (
    <View
      className={`rounded-2xl border p-4 ${
        elevated ? "bg-navy-700 border-navy-400/70" : "bg-navy-700 border-navy-500"
      } ${className}`}
      style={{
        shadowColor: "#101828",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
      {...rest}
    >
      {children}
    </View>
  );
}
