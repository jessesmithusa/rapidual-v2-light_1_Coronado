import * as ImagePicker from "expo-image-picker";
import type { OrderStage } from "@rapidual/shared";
import { supabase } from "./supabase";

export async function capturePhoto(): Promise<string | null> {
  const cam = await ImagePicker.requestCameraPermissionsAsync();
  let result: ImagePicker.ImagePickerResult;
  if (cam.granted) {
    result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
  } else {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) return null;
    result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ["images"] });
  }
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

/** Uploads a custody photo for an order. Best-effort; safe to call without a backend. */
export async function uploadCustody(orderId: string, stage: OrderStage, uri: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const bytes = await (await fetch(uri)).arrayBuffer();
    const path = `${user.id}/${orderId}/${stage}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("custody-photos")
      .upload(path, bytes, { contentType: "image/jpeg" });
    if (error) return false;
    await supabase
      .from("custody_photos")
      .insert({ order_id: orderId, stage, storage_path: path, captured_by: "driver" });
    return true;
  } catch {
    return false;
  }
}

/** Advances an order's stage (drives the consumer's Realtime timeline). */
export async function advanceOrderStage(orderId: string, stage: OrderStage): Promise<void> {
  try {
    await supabase
      .from("orders")
      .update({ stage, updated_at: new Date().toISOString() })
      .eq("id", orderId);
  } catch {
    // simulation mode
  }
}
