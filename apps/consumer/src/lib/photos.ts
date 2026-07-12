import * as ImagePicker from "expo-image-picker";
import type { CustodyPhoto, Order, OrderStage } from "@rapidual/shared";
import { supabase } from "./supabase";

/** Launch camera (or library if camera denied). Returns a local file uri or null. */
export async function pickCustodyPhoto(): Promise<string | null> {
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

/**
 * Upload a custody photo to the `custody-photos` bucket and log a row.
 * Falls back to the local uri (pure simulation) if there's no session or the
 * upload fails — so the timeline always shows the captured image.
 */
export async function uploadCustodyPhoto(
  order: Order,
  stage: OrderStage,
  uri: string,
): Promise<CustodyPhoto> {
  const local: CustodyPhoto = {
    id: `ph_${Math.random().toString(36).slice(2, 8)}`,
    stage,
    url: uri,
    capturedAt: new Date().toISOString(),
    capturedBy: "customer",
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return local;

    const bytes = await (await fetch(uri)).arrayBuffer();
    const path = `${user.id}/${order.id}/${stage}-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("custody-photos")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (error) return local;

    await supabase
      .from("custody_photos")
      .insert({ order_id: order.id, stage, storage_path: path, captured_by: "customer" });

    const { data: signed } = await supabase.storage
      .from("custody-photos")
      .createSignedUrl(path, 3600);

    return { ...local, url: signed?.signedUrl ?? uri };
  } catch {
    return local;
  }
}
