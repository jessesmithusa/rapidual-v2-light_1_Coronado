import { Stack } from "expo-router";
import { colors } from "@/theme/tokens";
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy900 } }}>
      <Stack.Screen name="stop/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="dispatch" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="earnings" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
