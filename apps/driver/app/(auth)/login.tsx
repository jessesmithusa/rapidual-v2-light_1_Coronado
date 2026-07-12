import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Button, Input, Badge } from "@rapidual/ui";
import { colors } from "@/theme/tokens";
import { signInWithEmail } from "@/lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) return setError("Enter your driver credentials.");
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="pt-16 pb-8 items-center">
          <View className="w-16 h-16 rounded-2xl bg-orange-500/15 items-center justify-center">
            <Ionicons name="car" size={30} color={colors.orange} />
          </View>
          <Badge label="Driver" tone="orange" />
          <Text variant="title" className="mt-3">Rapidual Driver</Text>
          <Text variant="label" className="mt-1">Sign in to start your route.</Text>
        </View>
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="driver@rapidual.com" autoCapitalize="none" keyboardType="email-address" inputMode="email" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        {error ? <Text className="text-danger text-sm mb-3">{error}</Text> : null}
        <Button title="Sign in" loading={loading} onPress={onSubmit} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
