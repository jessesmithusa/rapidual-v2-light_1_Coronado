import { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button } from "@rapidual/ui";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/theme/tokens";
import { pickCustodyPhoto } from "@/lib/photos";
import { submitClaim } from "@/data/repo";

const ISSUES = [
  { k: "missing", label: "Missing item", icon: "help-buoy" },
  { k: "damage", label: "Damaged item", icon: "alert-circle" },
  { k: "redo", label: "Needs a redo", icon: "refresh" },
  { k: "late", label: "Late delivery", icon: "time" },
  { k: "other", label: "Something else", icon: "ellipsis-horizontal" },
] as const;

export default function Report() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [issue, setIssue] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const attach = async () => {
    const uri = await pickCustodyPhoto();
    if (uri) setPhoto(uri);
  };

  if (done) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-success/15 items-center justify-center"><Ionicons name="checkmark-circle" size={56} color={colors.success} /></View>
          <Text variant="title" className="mt-4 text-center">Thanks — we're on it</Text>
          <Text variant="label" className="mt-1 text-center">Our team will follow up within 24 hours about order {String(id).toUpperCase()}.</Text>
          <Button title="Done" className="mt-6" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="flex-row items-center pt-2 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <Text variant="title">Report a problem</Text>
      </View>

      <Text variant="label" className="mb-2">What went wrong?</Text>
      <View className="gap-2.5">
        {ISSUES.map((o) => (
          <Pressable key={o.k} onPress={() => setIssue(o.k)}>
            <Card className={`flex-row items-center ${issue === o.k ? "border-orange-500" : ""}`}>
              <Ionicons name={o.icon as keyof typeof Ionicons.glyphMap} size={20} color={issue === o.k ? colors.orange : colors.inkMuted} />
              <Text variant="body" className="flex-1 ml-3 text-sm">{o.label}</Text>
              {issue === o.k ? <Ionicons name="checkmark-circle" size={20} color={colors.orange} /> : null}
            </Card>
          </Pressable>
        ))}
      </View>

      <Card className="mt-4">
        <Text variant="label" className="mb-2">Details (optional)</Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Tell us what happened…"
          placeholderTextColor={colors.inkFaint}
          multiline
          style={{ color: colors.ink, fontSize: 15, minHeight: 70, textAlignVertical: "top" }}
        />
      </Card>

      <Pressable onPress={attach} className="flex-row items-center justify-center rounded-2xl bg-navy-700 border border-navy-600/60 py-3 mt-3 active:opacity-80">
        <Ionicons name={photo ? "checkmark-circle" : "camera"} size={18} color={photo ? colors.success : colors.orange} />
        <Text className="text-ink font-semibold ml-2">{photo ? "Photo attached" : "Attach a photo"}</Text>
      </Pressable>

      <Button title="Submit report" className="mt-4" disabled={!issue} onPress={() => { void submitClaim(String(id), issue!, details, photo); setDone(true); }} />
    </Screen>
  );
}
