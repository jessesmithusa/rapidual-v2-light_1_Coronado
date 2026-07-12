import "../global.css";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "@/theme/tokens";
import { supabase } from "@/lib/supabase";
import { initMonitoring } from "@/lib/monitoring";
import { useLiveHydration } from "@/lib/hydrate";
import { useSession } from "@/store/session";
import { StripeGate } from "@/components/StripeGate";

SplashScreen.preventAutoHideAsync();

/** Load the persisted session and keep the store in sync with Supabase. */
function useAuthBootstrap() {
  const { setSession, setInitializing } = useSession();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
      SplashScreen.hideAsync();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [setSession, setInitializing]);
}

/** Redirect between the (auth) group and the app based on session state. */
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { session, initializing } = useSession();

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, initializing, segments, router]);
}

initMonitoring();

export default function RootLayout() {
  useAuthBootstrap();
  useLiveHydration();
  useProtectedRoute();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.navy900 }}>
      <SafeAreaProvider>
        <StripeGate>
          <StatusBar style="dark" />
          <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.navy900 },
            animation: "fade",
          }}
        >
          <Stack.Screen name="onboarding" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="wardrobe" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="schedule" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="track" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="rewards" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="refer" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="link-accounts" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="retailer/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="cart" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="recurring" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="notifications" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="payment-methods" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="impact" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="bag-tags/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="receipt/[id]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="report/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="delete-account" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="chat" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="rate/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          </Stack>
        </StripeGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
