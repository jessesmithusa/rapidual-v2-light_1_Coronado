import { useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, Card, Badge } from "@rapidual/ui";
import { daysOfWeek, timeOfDay } from "@rapidual/utils";
import type { ManifestStop } from "@rapidual/shared";
import { colors } from "@/theme/tokens";
import { useEffect } from "react";
import { useManifest } from "@/store/manifest";
import { signOut } from "@/lib/auth";
import { ManifestMap } from "@/components/map/ManifestMap";
import { planFullDay, planRemaining } from "@/lib/optimize";
import { useDriverBroadcast } from "@/lib/broadcast";
import { useDriverPosition, startBackgroundLocation, stopBackgroundLocation } from "@/lib/location";
import { useState } from "react";

const PARCEL_BLUE = "#85B7EB";

function meta(s: ManifestStop) {
  if (s.kind === "parcel")
    return { icon: "cube" as const, color: PARCEL_BLUE, text: `Drop · ${s.parcelCount} parcel${s.parcelCount === 1 ? "" : "s"}` };
  const verb = s.kind === "pickup" ? "Pick up" : "Re-deliver";
  const icon = s.kind === "pickup" ? ("briefcase" as const) : ("home" as const);
  return { icon, color: colors.orange, text: `${verb} · ${s.bagCount} bag${s.bagCount === 1 ? "" : "s"}` };
}

export default function Manifest() {
  const router = useRouter();
  const manifest = useManifest((s) => s.manifest);
  const hydrate = useManifest((s) => s.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  const stops = manifest.stops;

  const done = stops.filter((s) => s.status === "done").length;
  const laundry = stops.filter((s) => s.kind !== "parcel").length;
  const parcels = stops.filter((s) => s.kind === "parcel").length;

  const lastDone = [...stops].reverse().find((s) => s.status === "done");
  const active = stops.find((s) => s.status === "active");
  const anchor = active ?? stops[0]!;
  const simulated = lastDone && active ? { lat: (active.lat + lastDone.lat) / 2, lng: (active.lng + lastDone.lng) / 2 } : anchor;
  const livePos = useDriverPosition();
  const driver = livePos ?? simulated;
  const [sharing, setSharing] = useState(false);

  const toggleSharing = async () => {
    if (sharing) {
      await stopBackgroundLocation();
      setSharing(false);
    } else {
      const ok = await startBackgroundLocation(manifest.routeId);
      setSharing(ok);
    }
  };

  const day = useMemo(() => planFullDay(manifest), [manifest]);
  const remaining = useMemo(() => planRemaining(manifest, driver), [manifest, driver.lat, driver.lng]);
  const finishIso = new Date(Date.now() + remaining.durationMinutes * 60_000).toISOString();

  // Publish live location so the customer's tracking screen moves in real time.
  useDriverBroadcast(manifest.routeId, {
    lat: driver.lat,
    lng: driver.lng,
    etaMinutes: remaining.durationMinutes,
    stage: active?.stage,
  });

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between pt-2 pb-4">
          <View>
            <View className="flex-row items-center gap-2">
              <View className="bg-orange-500 px-2 py-0.5 rounded-full">
                <Text className="text-navy-900 text-[10px] font-bold">DRIVER</Text>
              </View>
              <Text variant="label">Today · {daysOfWeek[manifest.serviceDay]}</Text>
            </View>
            <Text variant="title" className="mt-1">{manifest.routeName}</Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable onPress={() => router.push("/(app)/earnings")} className="w-10 h-10 rounded-full bg-navy-700 border border-navy-600 items-center justify-center">
              <Ionicons name="cash-outline" size={20} color={colors.ink} />
            </Pressable>
            <Pressable onPress={() => router.push("/(app)/dispatch")} className="w-10 h-10 rounded-full bg-navy-700 border border-navy-600 items-center justify-center">
              <Ionicons name="grid-outline" size={20} color={colors.ink} />
            </Pressable>
            <Pressable onPress={() => signOut()} className="w-10 h-10 rounded-full bg-navy-700 border border-navy-600 items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <ManifestMap stops={stops} driver={driver} height={210} />

        <Card elevated className="mt-4">
          <View className="flex-row items-center justify-between">
            <Text variant="label">{manifest.driver.vehicle} · {manifest.driver.name}</Text>
            <Text variant="body" className="font-medium">{done} of {stops.length} stops</Text>
          </View>
          <View className="h-1.5 rounded-full bg-navy-900 mt-3 overflow-hidden">
            <View className="h-full bg-orange-500 rounded-full" style={{ width: `${(done / stops.length) * 100}%` }} />
          </View>
          <View className="flex-row gap-5 mt-3">
            <Text variant="caption"><Text className="text-orange-400 text-base font-medium">{laundry}</Text> laundry</Text>
            <Text variant="caption"><Text className="text-base font-medium" style={{ color: PARCEL_BLUE }}>{parcels}</Text> parcels</Text>
            <View className="ml-auto">
              <Text variant="caption"><Text className="text-success text-base font-medium">{Math.round(manifest.utilization * 100)}%</Text> loaded</Text>
            </View>
          </View>
          <Pressable
            onPress={toggleSharing}
            className={`flex-row items-center justify-center rounded-xl py-3 mt-4 active:opacity-80 ${sharing ? "bg-navy-600 border border-navy-500" : "bg-orange-500"}`}
          >
            <Ionicons name={sharing ? "radio" : "navigate"} size={18} color={sharing ? colors.orange : colors.navy900} />
            <Text className={`font-semibold ml-2 ${sharing ? "text-ink" : "text-navy-900"}`}>
              {sharing ? "Sharing live location" : "Go live · share location"}
            </Text>
          </Pressable>
        </Card>

        <Text variant="heading" className="mt-6 mb-3">Route optimization</Text>
        <Card elevated>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="git-branch" size={18} color={colors.orange} />
              <Text variant="heading" className="text-base ml-2">Sequenced · {day.distanceMiles} mi</Text>
            </View>
            <Badge label={day.feasible ? "On capacity" : "Over capacity"} tone={day.feasible ? "success" : "warning"} />
          </View>
          <View className="flex-row mt-4">
            <View className="flex-1">
              <Text variant="caption">REMAINING</Text>
              <Text variant="heading" className="mt-0.5">{remaining.distanceMiles} mi</Text>
            </View>
            <View className="flex-1">
              <Text variant="caption">EST. FINISH</Text>
              <Text variant="heading" className="mt-0.5">{timeOfDay(finishIso)}</Text>
            </View>
            <View className="flex-1">
              <Text variant="caption">PEAK LOAD</Text>
              <Text variant="heading" className="mt-0.5">{day.peakLoad}/{day.capacity}</Text>
            </View>
          </View>
          <View className="flex-row items-center mt-4 pt-3 border-t border-navy-600/60">
            <Ionicons name="swap-horizontal" size={16} color={colors.orange} />
            <Text variant="label" className="ml-2 flex-1">Loaded both directions</Text>
            <Text variant="body" className="text-orange-400 font-medium">{Math.round(day.loadedLegRatio * 100)}%</Text>
          </View>
        </Card>

        <Text variant="heading" className="mt-6 mb-3">Stops</Text>
        <View className="gap-2.5">
          {stops.map((s) => {
            const m = meta(s);
            const isDone = s.status === "done";
            const isActive = s.status === "active";
            return (
              <Pressable key={s.id} onPress={() => router.push(`/(app)/stop/${s.id}`)}>
                <Card className={isActive ? "border-orange-500" : ""} style={{ opacity: isDone ? 0.5 : 1 }}>
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${m.color}26` }}>
                      <Ionicons name={m.icon} size={19} color={m.color} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text variant="heading" className="text-sm">{m.text}</Text>
                      <Text variant="caption" className="mt-0.5">{s.customerName} · {s.address}</Text>
                    </View>
                    {isDone ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                    ) : isActive ? (
                      <View className="bg-orange-500 px-3 py-1 rounded-full"><Text className="text-navy-900 text-xs font-bold">Next</Text></View>
                    ) : (
                      <Text variant="caption">#{s.seq}</Text>
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
