import { useEffect, useState } from "react";
import { Pressable, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@rapidual/ui";
import { colors } from "@/theme/tokens";
import { isAppleAuthAvailable, signInWithApple, signInWithGoogle } from "@/lib/auth";

function SocialButton({
  icon,
  label,
  onPress,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center justify-center rounded-2xl bg-navy-600 border border-navy-500 px-5 py-4 mb-3 active:opacity-80"
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <>
          <Ionicons name={icon} size={20} color={colors.ink} />
          <Text className="text-ink font-semibold text-base ml-3">{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SocialButtons({ onError }: { onError: (msg: string) => void }) {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);

  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAvailable);
  }, []);

  const run = async (provider: "apple" | "google", fn: () => Promise<void>) => {
    setBusy(provider);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-in failed.";
      if (!/cancel/i.test(msg)) onError(msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View>
      {appleAvailable ? (
        <SocialButton
          icon="logo-apple"
          label="Continue with Apple"
          loading={busy === "apple"}
          onPress={() => run("apple", signInWithApple)}
        />
      ) : null}
      <SocialButton
        icon="logo-google"
        label="Continue with Google"
        loading={busy === "google"}
        onPress={() => run("google", signInWithGoogle)}
      />
    </View>
  );
}
