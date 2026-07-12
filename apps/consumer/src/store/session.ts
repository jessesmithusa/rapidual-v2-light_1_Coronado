import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Session store. The auth flow (next deliverable) will wire this to
 * supabase.auth.onAuthStateChange. Kept minimal for the skeleton.
 */
interface SessionState {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  setSession: (s: Session | null) => void;
  setInitializing: (b: boolean) => void;
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  user: null,
  initializing: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setInitializing: (initializing) => set({ initializing }),
}));
