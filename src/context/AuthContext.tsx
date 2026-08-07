/**
 * AuthContext — the single source of truth for authentication state.
 *
 * Responsibilities:
 *   - restore the persisted session on app launch (and on every remount)
 *   - keep the session fresh (Supabase auto-refreshes access tokens)
 *   - centralize sign-up / sign-in / sign-out / password reset / resend
 *   - auto-create the user profile after signup (DB trigger + fallback)
 *   - profile management: identity fields, username, avatar URL,
 *     emergency contact (Phase 3)
 *   - handle confirmation/reset deep links (PKCE code exchange)
 *   - expose `status`, `session`, `user`, `profile`, `emailVerified`
 *
 * Screens must read state from `useAuth()` — no duplicate auth logic.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Linking from "expo-linking";
import { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import {
  ensureProfile,
  fetchProfile,
  updateProfile,
  type ProfilePatch,
} from "../services/profiles";
import type { UserProfile } from "../types/profile";
import { AuthErrorDisplay, toFriendlyAuthError } from "../services/authErrors";
import { isAdmin as isAdminRpc, currentAdminRole as currentAdminRoleRpc } from "../services/admin";
import { signInWithGoogle as googleSignIn } from "../services/googleAuth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type SignUpResult = {
  /** True when a session exists immediately (email confirmation disabled). */
  sessionCreated: boolean;
};

export type GoogleSignInResult = {
  /** True when the user dismissed the Google account sheet. */
  cancelled: boolean;
  /** True when the signed-in account still needs its profile set up. */
  needsProfile: boolean;
};

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  /** True when the account's email has been confirmed. */
  emailVerified: boolean;
  /** Null until the admin check resolves; false for regular members. */
  isAdmin: boolean | null;
  /** The signed-in admin's role name (e.g. "super_admin"); null otherwise. */
  adminRole: string | null;
  /** True while a profile refresh / session restore is in flight. */
  busy: boolean;
  /** True once a reset deep-link code has been exchanged successfully. */
  resetReady: boolean;
  /** Error surfaced by a failed reset-code exchange (expired link etc.). */
  resetError: string | null;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<GoogleSignInResult>;
  /** Send a 6-digit OTP code to the email address. */
  sendOtp: (email: string) => Promise<void>;
  /** Verify a 6-digit OTP code and install the session. */
  verifyOtpEmail: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendVerification: (emailOverride?: string, fromSignup?: boolean) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfilePatch: (patch: ProfilePatch) => Promise<UserProfile>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_VERIFY_PATH = "verify";
const RESET_PATH = "reset";

type AuthDeepLinkKind = "verify" | "reset" | null;

function authDeepLinkKind(url: string): AuthDeepLinkKind {
  const normalized = url.toLowerCase();
  if (!normalized.includes("code=")) return null;
  if (normalized.includes(RESET_PATH)) return "reset";
  if (normalized.includes(EMAIL_VERIFY_PATH) || normalized.includes("callback")) return "verify";
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetReady, setResetReady] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const mounted = useRef(true);

  const emailVerified = Boolean(
    session?.user.email_confirmed_at || session?.user.confirmed_at,
  );

  const loadProfile = useCallback(
    async (userId: string, email: string | null | undefined) => {
    if (!mounted.current) return null;
    try {
      const p = await ensureProfile({ userId, email });
      if (mounted.current) setProfile(p);
      return p;
    } catch (err) {
      console.warn("[auth] profile load failed", err);
      if (mounted.current) {
        const fallback = await fetchProfile(userId).catch(() => null);
        if (fallback && mounted.current) setProfile(fallback);
      }
      return null;
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    if (!mounted.current) return;
    const [admin, role] = await Promise.all([isAdminRpc(), currentAdminRoleRpc()]);
    if (!mounted.current) return;
    setIsAdmin(admin);
    setAdminRole(admin ? role : null);
  }, []);

  const applySession = useCallback(
    async (next: Session | null) => {
      if (!mounted.current) return;
      setSession(next);
      setStatus(next ? "authenticated" : "unauthenticated");
      if (next) {
        void loadProfile(next.user.id, next.user.email);
        void loadAdmin();
      } else {
        setProfile(null);
        setIsAdmin(null);
        setAdminRole(null);
      }
    },
    [loadProfile, loadAdmin],
  );

  // ── Deep link handling (email confirmation / password reset, PKCE) ──
  const handleUrl = useCallback(
    async (url: string | null) => {
      if (!url || !isSupabaseConfigured) return;
      const kind = authDeepLinkKind(url);
      if (!kind) return;
      setBusy(true);
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (error) {
        console.warn("[auth] code exchange failed", error.message);
        if (kind === "reset") {
          setResetError(
            "This reset link is invalid or has expired. Request a new one and try again.",
          );
        }
      } else if (kind === "reset") {
        setResetReady(true);
        setResetError(null);
      }
      setBusy(false);
    },
    [],
  );

  useEffect(() => {
    mounted.current = true;

    // Restore persisted session (async → status flips from 'loading').
    void supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch((err) => {
        console.warn("[auth] getSession failed", err);
        if (mounted.current) setStatus("unauthenticated");
      });

    // Keep state in sync with every auth event (sign in/out, refresh, update).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      void applySession(next);
    });

    // Deep links (confirmation / reset emails) may arrive at any time.
    void Linking.getInitialURL().then(handleUrl);
    const urlListener = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
      urlListener.remove();
    };
  }, [applySession, handleUrl]);

  const signUp = useCallback(
    async (input: { email: string; password: string; fullName: string; phone?: string }) => {
      if (!isSupabaseConfigured) {
        throw new AuthErrorDisplay(
          "Authentication is not configured yet. Add your Supabase keys to .env and restart the app.",
        );
      }
      setBusy(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim().toLowerCase(),
          password: input.password,
          options: {
            data: {
              full_name: input.fullName.trim(),
              ...(input.phone ? { phone: input.phone.trim() } : {}),
            },
            emailRedirectTo: Linking.createURL(EMAIL_VERIFY_PATH, {
              queryParams: { from: "signup" },
            }),
          },
        });
        if (error) throw error;
        const user = data.user;
        if (!user) {
          throw new Error("Sign up did not return a user.");
        }
        if (data.session) {
          await loadProfile(user.id, user.email);
          return { sessionCreated: true };
        }
        return { sessionCreated: false };
      } finally {
        setBusy(false);
      }
    },
    [loadProfile],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new AuthErrorDisplay(
        "Authentication is not configured yet. Add your Supabase keys to .env and restart the app.",
      );
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      await loadProfile(data.user.id, data.user.email);
      return data.user;
    } finally {
      setBusy(false);
    }
  }, [loadProfile]);

  const signInWithGoogle = useCallback(async (): Promise<GoogleSignInResult> => {
    if (!isSupabaseConfigured) {
      throw new AuthErrorDisplay(
        "Authentication is not configured yet. Add your Supabase keys to .env and restart the app.",
      );
    }
    setBusy(true);
    try {
      const { cancelled, user } = await googleSignIn();
      if (cancelled || !user) return { cancelled, needsProfile: false };

      // The auth state event applies the session; load the profile explicitly
      // so we can decide where the user should land next.
      const loaded = await loadProfile(user.id, user.email);

      // Copy Google's avatar into the profile on first sign-in.
      const googleAvatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
      if (loaded && !loaded.avatarUrl && typeof googleAvatar === "string") {
        try {
          const updated = await updateProfile(user.id, { avatarUrl: googleAvatar });
          if (mounted.current) setProfile(updated);
        } catch (err) {
          console.warn("[auth] google avatar copy failed", err);
        }
      }

      // A fresh Google account gets a profile row (DB trigger) with no
      // username yet — send those users to profile setup.
      const needsProfile = !loaded?.username;
      return { cancelled: false, needsProfile };
    } finally {
      setBusy(false);
    }
  }, [loadProfile]);

  const sendOtp = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new AuthErrorDisplay(
        "Authentication is not configured yet. Add your Supabase keys to .env and restart the app.",
      );
    }
    setBusy(true);
    try {
      // shouldCreateUser: false — OTP must never mint accounts on its own;
      // it only emails an existing (e.g. just-signed-up) user.
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
    } finally {
      setBusy(false);
    }
  }, []);

  const verifyOtpEmail = useCallback(
    async (email: string, token: string) => {
      if (!isSupabaseConfigured) {
        throw new AuthErrorDisplay(
          "Authentication is not configured yet. Add your Supabase keys to .env and restart the app.",
        );
      }
      setBusy(true);
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: token.trim(),
          type: "email",
        });
        if (error) throw error;
        const user = data.user;
        if (!user) {
          throw new AuthErrorDisplay(
            "The code was accepted, but no account was found. Please try again.",
          );
        }
        await loadProfile(user.id, user.email);
      } finally {
        setBusy(false);
      }
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setBusy(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      throw new AuthErrorDisplay(
        "Authentication is not configured yet. Add your Supabase keys to .env and restart the app.",
      );
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: Linking.createURL(RESET_PATH) },
      );
      if (error) throw error;
    } finally {
      setBusy(false);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured) {
      throw new AuthErrorDisplay(
        "Authentication is not configured yet. Add your Supabase keys to .env and restart the app.",
      );
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } finally {
      setBusy(false);
    }
  }, []);

  const resendVerification = useCallback(async (emailOverride?: string, fromSignup?: boolean) => {
    const email = session?.user?.email ?? emailOverride;
    if (!email) {
      throw new AuthErrorDisplay("We don't know your email yet — please log in again.");
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: Linking.createURL(EMAIL_VERIFY_PATH, {
            ...(fromSignup ? { queryParams: { from: "signup" } } : {}),
          }),
        },
      });
      if (error) throw error;
    } finally {
      setBusy(false);
    }
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (!session) return null;
    return loadProfile(session.user.id, session.user.email);
  }, [session, loadProfile]);

  const updateProfilePatch = useCallback(
    async (patch: ProfilePatch) => {
      if (!session) throw new AuthErrorDisplay("You need to be logged in.");
      const updated = await updateProfile(session.user.id, patch);
      setProfile(updated);
      return updated;
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      emailVerified,
      isAdmin,
      adminRole,
      busy,
      resetReady,
      resetError,
      signUp,
      signIn,
      signInWithGoogle,
      sendOtp,
      verifyOtpEmail,
      signOut,
      resetPassword,
      updatePassword,
      resendVerification,
      refreshProfile,
      updateProfilePatch,
    }),
    [
      status,
      session,
      profile,
      emailVerified,
      isAdmin,
      adminRole,
      busy,
      resetReady,
      resetError,
      signUp,
      signIn,
      signInWithGoogle,
      sendOtp,
      verifyOtpEmail,
      signOut,
      resetPassword,
      updatePassword,
      resendVerification,
      refreshProfile,
      updateProfilePatch,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}

/** Friendly error string for screen-level error messages. */
export function authErrorMessage(err: unknown): string {
  return toFriendlyAuthError(err);
}
