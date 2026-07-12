import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Screen, Text, Button, Input, Divider } from "@rapidual/ui";
import { SocialButtons } from "@/components/SocialButtons";
import { signUpWithEmail } from "@/lib/auth";

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!fullName || !email || !password) {
      setError("Please fill in every field.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, fullName.trim());
      // Session is created (email confirmations off for MVP) → finish profile setup.
      router.replace("/onboarding");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="pt-12 pb-6">
          <Text variant="title">Create your account</Text>
          <Text variant="label" className="mt-2">
            Two bags, zero laundry days. Start in under a minute.
          </Text>
        </View>

        <Input
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Alex Rivera"
          autoCapitalize="words"
          autoComplete="name"
        />
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
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
        />

        {error ? <Text className="text-danger text-sm mb-3">{error}</Text> : null}

        <Button title="Create account" loading={loading} onPress={onSubmit} />
        <Button
          title="Already have an account? Log in"
          variant="ghost"
          className="mt-1"
          onPress={() => router.replace("/(auth)/login")}
        />

        <Divider label="or" />
        <SocialButtons onError={setError} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
