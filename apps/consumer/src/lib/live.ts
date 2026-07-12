import { env } from "./env";
import { supabase } from "./supabase";

/** True when a real Supabase backend is configured AND someone is signed in. */
export async function isLive(): Promise<boolean> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return false;
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

export async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
