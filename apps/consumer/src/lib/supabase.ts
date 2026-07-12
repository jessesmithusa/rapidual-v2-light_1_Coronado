import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { env } from "./env";

/**
 * Native: store the session in the device keychain/keystore via SecureStore.
 * Web: SecureStore is unavailable, fall back to AsyncStorage (localStorage).
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

/** SSR (Expo web static render) has no window/localStorage — use a no-op until hydration. */
const ssrSafeStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const storage =
  Platform.OS === "web"
    ? typeof window !== "undefined"
      ? AsyncStorage
      : ssrSafeStorage
    : SecureStoreAdapter;

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage,
    flowType: "pkce", // mobile OAuth (Google) returns a code we exchange for a session
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
