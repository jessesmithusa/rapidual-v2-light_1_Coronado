import { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card, Badge } from "@rapidual/ui";
import { stageLabel, etaText } from "@rapidual/utils";
import { colors } from "@/theme/tokens";
import { SAMPLE_ORDER } from "@/mock/order";
import { useTrackedOrder } from "@/hooks/useTrackedOrder";
import { useRouter } from "expo-router";
import { TrackMap } from "@/components/map/TrackMap";
import { CustodyTimeline } from "@/components/track/CustodyTimeline";
import { pickCustodyPhoto, uploadCustodyPhoto } from "@/lib/photos";

const ACTIVE = ["driver_enroute_pickup", "driver_enroute_delivery"];

export default function Track() {
  const router = useRouter();
  const { order, path, driver, destination, etaMinutes, isLive, addPhoto } = useTrackedOrder(SAMPLE_ORDER);
  const [capturing, setCapturing] = useState(false);

  const onCapture = async () => {
    setCapturing(true);
    try {
      const uri = await pickCustodyPhoto();
      if (uri) addPhoto(await uploadCustodyPhoto(order, order.stage, uri));
    } finally {
      setCapturing(false);
    }
  };

  const enRoute = ACTIVE.includes(order.stage);

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between pt-2 pb-4">
          <View>
            <Text variant="label">Order #{order.id.slice(-4)}</Text>
            <Text variant="title">{stageLabel(order.stage)}</Text>
          </View>
          <Badge label={`${order.bagCount} bags`} tone="navy" />
        </View>

        <TrackMap path={path} driver={driver} destination={destination} height={220} />

        {/* Driver / ETA */}
        <Card elevated className="mt-4 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-orange-500/15 items-center justify-center">
            <Ionicons name="car" size={22} color={colors.orange} />
          </View>
          <View className="flex-1 ml-4">
            <Text variant="heading">{order.driver?.name ?? "Your driver"}</Text>
            <Text variant="caption" className="mt-0.5">{order.driver?.vehicle}</Text>
          </View>
          <View className="items-end">
            <Text variant="caption">{isLive ? "Live ETA" : enRoute ? "ETA" : "Update"}</Text>
            <Text variant="heading" className="text-orange-400">
              {isLive || enRoute ? etaText(etaMinutes) : "Soon"}
            </Text>
            {isLive ? (
              <View className="flex-row items-center mt-1">
                <View className="w-1.5 h-1.5 rounded-full bg-success mr-1" />
                <Text variant="caption" className="text-success">Live GPS</Text>
              </View>
            ) : null}
          </View>
        </Card>

        <Pressable
          onPress={() => router.push("/chat")}
          className="flex-row items-center justify-center rounded-2xl bg-navy-700 border border-navy-600/60 py-3 mt-3 active:opacity-80"
        >
          <Ionicons name="chatbubble-ellipses" size={18} color={colors.orange} />
          <Text className="text-ink font-semibold ml-2">Message your driver</Text>
        </Pressable>
        <View className="flex-row gap-3 mt-3">
          <Pressable onPress={() => router.push(`/bag-tags/${order.id}?bags=${order.bagCount}`)} className="flex-1 flex-row items-center justify-center rounded-2xl bg-navy-700 border border-navy-600/60 py-3 active:opacity-80">
            <Ionicons name="qr-code" size={18} color={colors.orange} />
            <Text className="text-ink font-semibold ml-2">Bag tags</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/report/${order.id}`)} className="flex-1 flex-row items-center justify-center rounded-2xl bg-navy-700 border border-navy-600/60 py-3 active:opacity-80">
            <Ionicons name="alert-circle" size={18} color={colors.orange} />
            <Text className="text-ink font-semibold ml-2">Report</Text>
          </Pressable>
        </View>

        <Text variant="heading" className="mt-7 mb-4">Chain of custody</Text>
        <CustodyTimeline order={order} capturing={capturing} onCapture={onCapture} />
      </ScrollView>
    </SafeAreaView>
  );
}
