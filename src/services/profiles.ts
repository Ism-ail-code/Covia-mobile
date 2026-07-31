/**
 * Profiles service — read/write the `public.profiles` table in Supabase.
 *
 * Signup guarantees a profile row exists (DB trigger + client fallback),
 * so the rest of the app can always rely on `profile` being present for
 * an authenticated user.
 */

import { supabase } from "./supabase";
import { DEFAULT_PROFILE, type UserProfile } from "../types/profile";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  home_city: string | null;
  bio: string | null;
  verification_status: UserProfile["verificationStatus"] | null;
  rating: number | null;
  reliability_score: number | null;
  is_government_id_verified: boolean | null;
  is_student_verified: boolean | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ProfileRow): UserProfile {
  const emailPrefix = (row.email ?? "").split("@")[0] || "Traveller";
  return {
    id: row.id,
    email: row.email,
    displayName:
      row.display_name ?? row.full_name ?? emailPrefix,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    homeCity: row.home_city,
    bio: row.bio,
    verificationStatus: row.verification_status ?? DEFAULT_PROFILE.verificationStatus,
    rating: row.rating ?? DEFAULT_PROFILE.rating,
    reliabilityScore: row.reliability_score ?? DEFAULT_PROFILE.reliabilityScore,
    isGovernmentIdVerified: row.is_government_id_verified ?? false,
    isStudentVerified: row.is_student_verified ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetch the profile for a user id. Returns null when no row exists. */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as ProfileRow) : null;
}

/**
 * Create a profile row with default values if one does not already exist.
 * Idempotent — safe to call on every app start / after signup.
 */
export async function ensureProfile(input: {
  userId: string;
  email: string | null | undefined;
  displayName?: string | null;
}): Promise<UserProfile> {
  const existing = await fetchProfile(input.userId);
  if (existing) return existing;

  const { error } = await supabase.from("profiles").insert({
    id: input.userId,
    email: input.email,
    display_name: input.displayName || null,
  });

  if (error) {
    // Another request may have just created it (race) — try once more.
    const retry = await fetchProfile(input.userId);
    if (retry) return retry;
    throw error;
  }

  const created = await fetchProfile(input.userId);
  if (!created) throw new Error("Profile was not created.");
  return created;
}

/** Update the current user's own profile (RLS restricts to own row). */
export async function updateProfile(
  userId: string,
  patch: Partial<
    Pick<
      UserProfile,
      | "displayName"
      | "fullName"
      | "avatarUrl"
      | "phone"
      | "homeCity"
      | "bio"
      | "verificationStatus"
    >
  >,
): Promise<UserProfile> {
  const columnMap: Record<string, string> = {
    displayName: "display_name",
    fullName: "full_name",
    avatarUrl: "avatar_url",
    phone: "phone",
    homeCity: "home_city",
    bio: "bio",
    verificationStatus: "verification_status",
  };

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) updates[columnMap[key]] = value;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as ProfileRow);
}
