import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

export function Screen({
  children,
  scroll = false,
  className = "",
}: {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
}) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <Body
        className={`flex-1 px-5 ${className}`}
        {...(scroll
          ? { contentContainerClassName: "pb-10", showsVerticalScrollIndicator: false }
          : {})}
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}
