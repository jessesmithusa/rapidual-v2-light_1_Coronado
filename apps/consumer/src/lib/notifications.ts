import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { savePushToken } from "@/data/repo";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Requests push permission on a dev/standalone build. No-ops in Expo Go. */
export async function registerForPush(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    const N = require("expo-notifications");
    const { status } = await N.requestPermissionsAsync();
    if (status !== "granted") return false;
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const { data: token } = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      if (token) await savePushToken(token, Platform.OS === "ios" ? "ios" : "android");
    } catch { /* token save is best-effort */ }
    return true;
  } catch {
    return false;
  }
}

/** Schedules a weekly local reminder the morning before a standing pickup. */
export async function schedulePickupReminder(weekday: number, bags: number): Promise<void> {
  if (isExpoGo) return;
  try {
    const N = require("expo-notifications");
    await N.scheduleNotificationAsync({
      content: { title: "Pickup tomorrow", body: `Your standing pickup (${bags} bags) is tomorrow. Need an extra bag?` },
      // SDK 54+ typed trigger; WEEKLY repeats by nature (no `repeats` field).
      trigger: { type: N.SchedulableTriggerInputTypes.WEEKLY, weekday: ((weekday + 6) % 7) + 1, hour: 9, minute: 0 },
    });
  } catch {
    // not available
  }
}
