/**
 * Google Sign-In service — native Google authentication wired into Supabase.
 *
 * Flow:
 *   1. GoogleSignin.signIn() returns an ID token from Google Play Services.
 *   2. supabase.auth.signInWithIdToken({ provider: "google", token })
 *      creates/looks up the Supabase user and installs a normal session.
 *   3. The existing AuthContext session handling (profile + admin load)
 *      takes over from there.
 *
 * The profile row is created automatically by the `handle_new_user` DB
 * trigger (migration 0001) using Google's `full_name` metadata, with
 * `ensureProfile()` as the client-side fallback.
 *
 * Configuration:
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID — Google Cloud OAuth "Web" client ID.
 *   The Android client ID lives in google-services.json (git-ignored); the
 *   iOS client ID is configured in app.json. Supabase Auth must have the
 *   Google provider enabled with the same client IDs.
 */

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { supabase, isSupabaseConfigured } from "./supabase";
import { AuthErrorDisplay } from "./authErrors";
import type { User } from "@supabase/supabase-js";

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  offlineAccess: false,
});

export type GoogleSignInResult = {
  /** True when the user dismissed the Google sheet — not an error. */
  cancelled: boolean;
  /** Present only when the sign-in completed. */
  user?: User;
};

function isCancelledError(err: unknown): boolean {
  const code =
    typeof err === "object" && err !== null
      ? ((err as { code?: unknown }).code ?? "")
      : "";
  return (
    code === GoogleSignin.SIGN_IN_CANCELLED ||
    code === "-5" ||
    code === "SIGN_IN_CANCELLED" ||
    (err instanceof Error && err.message.includes("cancelled"))
  );
}

/**
 * Sign in with the native Google account sheet.
 * Throws AuthErrorDisplay for everything except user cancellation.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isSupabaseConfigured) {
    throw new AuthErrorDisplay(
      "Authentication is not configured yet. Add your Supabase keys to .env and restart the app.",
    );
  }
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new AuthErrorDisplay(
      "Google sign-in isn't configured yet. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env and restart the app.",
    );
  }

  try {
    await GoogleSignin.hasPlayServices();
  } catch (err) {
    if (isCancelledError(err)) return { cancelled: true };
    console.warn("[google] Play services unavailable", err);
    throw new AuthErrorDisplay(
      "Google Play services isn't available on this device, which is required for Google sign-in. Please update it and try again.",
    );
  }

  let idToken: string;
  try {
    const response = await GoogleSignin.signIn();
    idToken = response.idToken ?? "";
  } catch (err) {
    if (isCancelledError(err)) return { cancelled: true };
    console.warn("[google] signIn failed", err);
    throw new AuthErrorDisplay(
      "Couldn't sign in with Google right now. Please try again.",
    );
  }

  if (!idToken) {
    throw new AuthErrorDisplay(
      "Google didn't return a session. Please try again.",
    );
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
  const user = data.user;
  if (!user) {
    throw new AuthErrorDisplay(
      "Google sign-in succeeded, but no account was created. Please try again.",
    );
  }
  return { cancelled: false, user };
}
