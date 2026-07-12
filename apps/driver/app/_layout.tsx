import "../global.css";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "@/theme/tokens";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/store/session";

SplashScreen.preventAutoHideAsync();

function useAuthBootstrap() {
  const { setSession, setInitializing } = useSession();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
      SplashScreen.hideAsync();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => sub.subscription.unsubscribe();
  }, [setSession, setInitializing]);
}

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { session, initializing } = useSession();
  useEffect(() => {
    if (initializing) return;
    const inAuth = segments[0] === "(auth)";
    if (!session && !inAuth) router.replace("/(auth)/login");
    else if (session && inAuth) router.replace("/(app)/manifest");
  }, [session, initializing, segments, router]);
}

export default function RootLayout() {
  useAuthBootstrap();
  useProtectedRoute();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.navy900 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy900 }, animation: "fade" }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
