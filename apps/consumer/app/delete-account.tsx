import { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button } from "@rapidual/ui";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { deleteAccount } from "@/data/repo";
import { supabase } from "@/lib/supabase";

export default function DeleteAccount() {
  const router = useRouter();
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setErr(null);
    const res = await deleteAccount();
    if (!res.ok) {
      setErr(res.message ?? "Could not delete the account. Contact support@rapidual.com.");
      setBusy(false);
      return;
    }
    await supabase.auth.signOut(); // route guard returns to welcome
  };

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Delete account</Text>
      </View>

      <Card className="flex-row items-start" style={{ borderColor: colors.danger }}>
        <Ionicons name="warning" size={20} color={colors.danger} />
        <Text variant="label" className="ml-3 flex-1 leading-6">
          This permanently deletes your account and everything attached to it — orders, points, saved addresses,
          standing pickups, and chat history. Saved cards live with Stripe and stop being usable here. This can't be undone.
        </Text>
      </Card>

      <Card className="mt-4">
        <Text variant="label" className="mb-2">Type DELETE to confirm</Text>
        <TextInput
          value={phrase}
          onChangeText={setPhrase}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="DELETE"
          placeholderTextColor={colors.inkFaint}
          style={{ color: colors.ink, fontSize: 16, paddingVertical: 6 }}
        />
      </Card>

      {err ? <Text variant="caption" className="text-orange-400 mt-3 text-center">{err}</Text> : null}
      <Button
        title={busy ? "Deleting…" : "Permanently delete my account"}
        className="mt-4"
        disabled={phrase !== "DELETE" || busy}
        onPress={confirm}
      />
      <Button title="Keep my account" variant="ghost" className="mt-2" onPress={() => router.back()} />
    </Screen>
  );
}
