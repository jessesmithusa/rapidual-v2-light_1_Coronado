import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Text, Button, Input, Divider } from "@rapidual/ui";
import { SocialButtons } from "@/components/SocialButtons";
import { signInWithEmail } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // Route guard redirects to /(tabs) once the session lands.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="pt-12 pb-6">
          <Text variant="title">Welcome back</Text>
          <Text variant="label" className="mt-2">
            Log in to manage your subscription and track pickups.
          </Text>
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="current-password"
        />

        {error ? <Text className="text-danger text-sm mb-3">{error}</Text> : null}

        <Button title="Log in" loading={loading} onPress={onSubmit} />
        <Button
          title="New here? Create an account"
          variant="ghost"
          className="mt-1"
          onPress={() => router.replace("/(auth)/signup")}
        />

        <Divider label="or" />
        <SocialButtons onError={setError} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
