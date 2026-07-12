import { useState } from "react";
import { View, ScrollView, Pressable, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, Card, Button, Badge } from "@rapidual/ui";
import { labelOfPrefs } from "@/lib/prefs";
import { colors } from "@/theme/tokens";
import { useManifest } from "@/store/manifest";
import { capturePhoto, uploadCustody } from "@/lib/photos";

const PARCEL_BLUE = "#85B7EB";

export default function StopDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const stop = useManifest((s) => s.manifest.stops.find((x) => x.id === id));
  const completeStop = useManifest((s) => s.completeStop);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState<"capture" | "confirm" | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);

  if (!stop) {
    return (
      <SafeAreaView className="flex-1 bg-navy-900 items-center justify-center" edges={["top"]}>
        <Text variant="label">Stop not found.</Text>
      </SafeAreaView>
    );
  }

  const isParcel = stop.kind === "parcel";
  const tone = isParcel ? "navy" : "orange";
  const kindLabel = isParcel ? "Parcel delivery" : stop.kind === "pickup" ? "Laundry pickup" : "Laundry re-delivery";
  const action = isParcel
    ? `Drop · ${stop.parcelCount} parcel${stop.parcelCount === 1 ? "" : "s"}`
    : `${stop.kind === "pickup" ? "Pick up" : "Re-deliver"} · ${stop.bagCount} bag${stop.bagCount === 1 ? "" : "s"}`;

  const navigate = () => {
    const q = encodeURIComponent(`${stop.address}, Santa Ana, CA`);
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${q}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    });
    Linking.openURL(url!);
  };

  const scanBag = () => {
    const code = `${(stop.orderId ?? stop.id).toUpperCase()}-B1`;
    setScanned(code);
  };

  const onCapture = async () => {
    setBusy("capture");
    try {
      const uri = await capturePhoto();
      if (uri) {
        setPhotoUri(uri);
        if (stop.orderId && stop.stage) uploadCustody(stop.orderId, stop.stage, uri);
      }
    } finally {
      setBusy(null);
    }
  };

  const onConfirm = async () => {
    setBusy("confirm");
    completeStop(stop.id); // marks done, advances order stage, promotes next stop
    setBusy(null);
    router.back();
  };

  const confirmLabel = isParcel ? "Confirm drop" : stop.kind === "pickup" ? "Confirm pickup" : "Confirm delivery";

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.ink} />
          </Pressable>
          <Text variant="label">Stop {stop.seq} of {useManifest.getState().manifest.stops.length}</Text>
          <View style={{ width: 26 }} />
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-4" showsVerticalScrollIndicator={false}>
        <View className="pt-3">
          <Badge label={kindLabel} tone={tone} />
          <Text variant="title" className="mt-3">{action}</Text>
          <Text variant="label" className="mt-1">{stop.customerName}</Text>
          <Text variant="label" className="mt-0.5">{stop.address}, Santa Ana</Text>
        </View>

        {stop.preferences ? (
          <Card className="mt-5">
            <Text variant="caption" className="tracking-wider">WASH PREFERENCES</Text>
            <View className="flex-row flex-wrap gap-2 mt-3">
              {labelOfPrefs(stop.preferences).map((l) => (
                <View key={l} className="rounded-full bg-navy-600 border border-navy-500 px-3 py-1.5">
                  <Text className="text-ink text-xs">{l}</Text>
                </View>
              ))}
            </View>
            {stop.preferences.notes ? (
              <View className="flex-row items-start gap-2 mt-3 pt-3 border-t border-navy-600/60">
                <Ionicons name="chatbox-ellipses" size={16} color={colors.orange} />
                <Text variant="body" className="flex-1 text-sm">{stop.preferences.notes}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {stop.windowStart ? (
          <View className="flex-row items-center gap-2 mt-4">
            <Ionicons name="time-outline" size={16} color={colors.inkMuted} />
            <Text variant="label">Window {stop.windowStart}–{stop.windowEnd}</Text>
          </View>
        ) : null}

        {photoUri ? (
          <Card className="mt-4 flex-row items-center">
            <Image source={{ uri: photoUri }} style={{ width: 56, height: 56, borderRadius: 12 }} contentFit="cover" />
            <View className="ml-3 flex-1">
              <Text variant="body" className="text-sm">Custody photo captured</Text>
              <Text variant="caption" className="mt-0.5">Logged to this {isParcel ? "drop" : "stop"}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          </Card>
        ) : null}
      </ScrollView>

      <View className="px-5 pb-4">
        {scanned ? (
          <View className="flex-row items-center bg-navy-700 border border-navy-600/60 rounded-2xl p-3 mb-2">
            <Ionicons name="qr-code" size={20} color={colors.success} />
            <View className="flex-1 ml-3">
              <Text variant="body" className="text-sm">Bag {scanned} scanned</Text>
              <Text variant="caption" className="mt-0.5">Custody logged for this {isParcel ? "drop" : "stop"}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          </View>
        ) : null}
        {!isParcel ? <Button title={scanned ? "Scan next bag" : "Scan bag"} variant="secondary" onPress={scanBag} className="mb-2" /> : null}
        <Button title="Navigate" variant="secondary" onPress={navigate} className="mb-2" />
        <View className="flex-row gap-2.5">
          <Button title={busy === "capture" ? "Opening…" : "Capture"} variant="secondary" loading={busy === "capture"} onPress={onCapture} className="flex-1" />
          <Button title={confirmLabel} loading={busy === "confirm"} onPress={onConfirm} className="flex-[1.4]" />
        </View>
      </View>
    </SafeAreaView>
  );
}
