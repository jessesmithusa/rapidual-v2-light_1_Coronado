import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@rapidual/ui";
import { timeOfDay } from "@rapidual/utils";
import { ORDER_STAGE_ORDER, type Order } from "@rapidual/shared";
import { stageLabel } from "@rapidual/utils";
import { colors } from "@/theme/tokens";

function PhotoTile({ url, by }: { url: string; by: string }) {
  const renderable = /^(file|content|http|data)/.test(url);
  return (
    <View className="mr-2">
      {renderable ? (
        <Image source={{ uri: url }} style={{ width: 64, height: 64, borderRadius: 12 }} contentFit="cover" />
      ) : (
        <View className="w-16 h-16 rounded-xl bg-navy-600 border border-navy-500 items-center justify-center">
          <Ionicons name="image" size={22} color={colors.inkFaint} />
        </View>
      )}
      <Text variant="caption" className="mt-1 capitalize">{by}</Text>
    </View>
  );
}

export function CustodyTimeline({
  order,
  capturing,
  onCapture,
}: {
  order: Order;
  capturing: boolean;
  onCapture: () => void;
}) {
  const current = ORDER_STAGE_ORDER.indexOf(order.stage);

  return (
    <View>
      {ORDER_STAGE_ORDER.map((stage, idx) => {
        const done = idx < current;
        const isCurrent = idx === current;
        const upcoming = idx > current;
        const isLast = idx === ORDER_STAGE_ORDER.length - 1;
        const photos = order.photos.filter((p) => p.stage === stage);

        return (
          <View key={stage} className="flex-row">
            <View className="items-center mr-4" style={{ width: 22 }}>
              <View
                className={`w-5 h-5 rounded-full items-center justify-center ${
                  done || isCurrent ? "bg-orange-500" : "bg-navy-600 border border-navy-500"
                }`}
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : isCurrent ? (
                  <View className="w-2 h-2 rounded-full bg-white" />
                ) : null}
              </View>
              {!isLast ? (
                <View className={`w-0.5 flex-1 my-1 ${done ? "bg-orange-500" : "bg-navy-600"}`} />
              ) : null}
            </View>

            <View className="flex-1 pb-6">
              <Text variant="heading" className={`text-base ${upcoming ? "text-ink-faint" : ""}`}>
                {stageLabel(stage)}
              </Text>
              {isCurrent ? (
                <Text variant="caption" className="mt-0.5 text-orange-400">In progress now</Text>
              ) : null}

              {photos.length ? (
                <View className="flex-row mt-3">
                  {photos.map((p) => (
                    <PhotoTile key={p.id} url={p.url} by={p.capturedBy} />
                  ))}
                </View>
              ) : null}

              {isCurrent ? (
                <Pressable
                  onPress={onCapture}
                  disabled={capturing}
                  className="flex-row items-center self-start mt-3 rounded-xl bg-navy-600 border border-navy-500 px-3 py-2 active:opacity-80"
                >
                  <Ionicons name={capturing ? "hourglass" : "camera"} size={16} color={colors.orange} />
                  <Text className="text-ink font-medium ml-2 text-sm">
                    {capturing ? "Uploading…" : "Add photo"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
