/**
 * Supabase client — the single authenticated gateway for the app.
 *
 * Configuration comes from Expo public environment variables:
 *   EXPO_PUBLIC_SUPABASE_URL      — project URL (safe to expose)
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY — anon key (safe to expose)
 *
 * Sessions are persisted to AsyncStorage so the user stays logged in
 * across app restarts. Access tokens auto-refresh while the app runs.
 *
 * NOTE: `detectSessionInUrl` is disabled on native — deep links from
 * confirmation/reset emails are handled explicitly by AuthContext
 * (see src/context/AuthContext.tsx).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("YOUR_PROJECT_REF"),
);

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not configured. " +
      "Copy .env.example to .env and fill in your Supabase project credentials.",
  );
}

export const supabase = createClient(SUPABASE_URL || "https://placeholder.supabase.co", SUPABASE_ANON_KEY || "placeholder", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
