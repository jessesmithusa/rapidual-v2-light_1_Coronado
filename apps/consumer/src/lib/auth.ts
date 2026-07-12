import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

// Dismisses the in-app browser automatically once auth completes.
WebBrowser.maybeCompleteAuthSession();

// rapidual:// on native, http://localhost:8081 on web — matches config.toml redirect URLs.
const redirectTo = Linking.createURL("/");

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export const isAppleAuthAvailable = () =>
  Platform.OS === "ios" ? AppleAuthentication.isAvailableAsync() : Promise.resolve(false);

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error("Apple did not return an identity token.");
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Could not start Google sign-in.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return; // user dismissed

  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code;
  if (typeof code !== "string") throw new Error("No authorization code returned.");

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
