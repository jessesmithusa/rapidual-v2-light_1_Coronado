import { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Text, Card, Button } from "@rapidual/ui";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/theme/tokens";
import { useLoyalty } from "@/store/loyalty";
import { submitRating } from "@/data/repo";
import { presentTipPayment } from "@/lib/payments";

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View className="flex-row gap-2 mt-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={36} color={n <= value ? colors.orange : colors.inkFaint} />
        </Pressable>
      ))}
    </View>
  );
}

export default function RateOrder() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const earn = useLoyalty((s) => s.earn);
  const [driver, setDriver] = useState(0);
  const [experience, setExperience] = useState(0);
  const [comments, setComments] = useState("");
  const [tip, setTip] = useState(0);
  const [done, setDone] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    if (tip > 0) {
      const pay = await presentTipPayment(String(id), tip * 100); // real charge when live
      if (!pay.ok) {
        setErr(pay.message);
        setBusy(false);
        return;
      }
    }
    void submitRating(String(id), { driver, timeliness: experience || driver, quality: experience || driver, tipCents: tip * 100, comments });
    earn(50, "review");
    setBusy(false);
    setDone(true);
    setTimeout(() => router.back(), 1100);
  };

  if (done) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 rounded-full bg-success/15 items-center justify-center">
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text variant="title" className="mt-4">Thanks for the rating!</Text>
          <Text variant="label" className="mt-1">You earned 50 Rapid Points 🎉</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between pt-2 mb-4">
        <Text variant="title">Rate Your Experience</Text>
        <Pressable onPress={() => router.back()}><Ionicons name="close" size={26} color={colors.inkMuted} /></Pressable>
      </View>
      {id ? <Text variant="caption" className="-mt-2 mb-4">Order {String(id)}</Text> : null}

      <Card>
        <Text variant="heading" className="text-base">How was your driver's service?</Text>
        <Stars value={driver} onChange={setDriver} />
      </Card>

      <Card className="mt-3">
        <Text variant="heading" className="text-base">How was your experience with Rapidual?</Text>
        <Stars value={experience} onChange={setExperience} />
      </Card>

      <Card className="mt-3">
        <Text variant="heading" className="text-base">Tip your driver</Text>
        <View className="flex-row gap-2 mt-3">
          {[3, 5, 8].map((t) => (
            <Pressable key={t} onPress={() => setTip(t)} className={`flex-1 rounded-xl py-2.5 items-center ${tip === t ? "bg-orange-500" : "bg-navy-600 border border-navy-500"}`}>
              <Text className={tip === t ? "text-white font-bold" : "text-ink font-semibold"}>${t}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setTip(0)} className={`flex-1 rounded-xl py-2.5 items-center ${tip === 0 ? "bg-navy-500 border border-navy-400" : "bg-navy-600 border border-navy-500"}`}>
            <Text className="text-ink-muted font-semibold">No tip</Text>
          </Pressable>
        </View>
      </Card>

      <Card className="mt-3">
        <Text variant="label" className="mb-2">Additional Comments (Optional)</Text>
        <TextInput
          value={comments}
          onChangeText={setComments}
          placeholder="Tell us more…"
          placeholderTextColor={colors.inkFaint}
          multiline
          style={{ color: colors.ink, fontSize: 15, minHeight: 80, textAlignVertical: "top" }}
        />
      </Card>

      {err ? <Text variant="caption" className="text-orange-400 mt-3 text-center">{err}</Text> : null}
      <Button
        title={busy ? "Processing…" : tip > 0 ? `Submit · Tip $${tip} & Earn 50 Points` : "Submit Rating & Earn 50 Points"}
        className="mt-6"
        disabled={driver === 0 && experience === 0}
        disabled={busy}
        onPress={submit}
      />
    </Screen>
  );
}
