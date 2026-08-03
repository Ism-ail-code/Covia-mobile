/**
 * Profiles service — read/write the `public.profiles` table in Supabase.
 *
 * Phase 3 surface:
 *   - fetch/ensure/update own profile (private model)
 *   - username: availability check, update with duplicate/reserved handling
 *   - emergency contact: set/clear (all-or-nothing)
 *   - other users: public profile lookup + username search (RPC functions)
 *
 * Signup guarantees a profile row exists (DB trigger + client fallback),
 * so the rest of the app can always rely on `profile` being present for
 * an authenticated user.
 */

import { supabase } from "./supabase";
import {
  DEFAULT_PROFILE,
  type EmergencyContact,
  type PublicProfile,
  type UserProfile,
} from "../types/profile";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: UserProfile["gender"];
  home_city: string | null;
  country: string | null;
  bio: string | null;
  verification_status: UserProfile["verificationStatus"] | null;
  rating: number | null;
  reliability_score: number | null;
  total_completed_rides: number | null;
  total_cancelled_rides: number | null;
  is_government_id_verified: boolean | null;
  is_student_verified: boolean | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  created_at: string;
  updated_at: string;
};

type PublicProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  overall_rating: number | null;
  reliability_score: number | null;
  total_completed_rides: number | null;
  total_cancelled_rides: number | null;
  verification_status: UserProfile["verificationStatus"] | null;
  is_government_id_verified: boolean | null;
  is_student_verified: boolean | null;
  created_at: string;
};

const EC_COLUMNS = [
  "emergency_contact_name",
  "emergency_contact_phone",
  "emergency_contact_relationship",
] as const;

function mapEmergencyContact(row: ProfileRow): EmergencyContact | null {
  const { emergency_contact_name: name, emergency_contact_phone: phone, emergency_contact_relationship: relationship } = row;
  if (!name || !phone || !relationship) return null;
  return { name, phone, relationship };
}

function mapRow(row: ProfileRow): UserProfile {
  const emailPrefix = (row.email ?? "").split("@")[0] || "Traveller";
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? row.full_name ?? emailPrefix,
    fullName: row.full_name,
    username: row.username,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    homeCity: row.home_city,
    country: row.country,
    bio: row.bio,
    verificationStatus: row.verification_status ?? DEFAULT_PROFILE.verificationStatus,
    rating: Number(row.rating ?? DEFAULT_PROFILE.rating),
    reliabilityScore: row.reliability_score ?? DEFAULT_PROFILE.reliabilityScore,
    totalCompletedRides: row.total_completed_rides ?? DEFAULT_PROFILE.totalCompletedRides,
    totalCancelledRides: row.total_cancelled_rides ?? DEFAULT_PROFILE.totalCancelledRides,
    isGovernmentIdVerified: row.is_government_id_verified ?? false,
    isStudentVerified: row.is_student_verified ?? false,
    emergencyContact: mapEmergencyContact(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublicRow(row: PublicProfileRow): PublicProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.profile_photo_url,
    bio: row.bio,
    city: row.city,
    country: row.country,
    overallRating: Number(row.overall_rating ?? DEFAULT_PROFILE.rating),
    reliabilityScore: row.reliability_score ?? DEFAULT_PROFILE.reliabilityScore,
    totalCompletedRides: row.total_completed_rides ?? 0,
    totalCancelledRides: row.total_cancelled_rides ?? 0,
    verificationStatus: row.verification_status ?? DEFAULT_PROFILE.verificationStatus,
    isGovernmentIdVerified: row.is_government_id_verified ?? false,
    isStudentVerified: row.is_student_verified ?? false,
    createdAt: row.created_at,
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

export type ProfilePatch = Partial<
  Pick<
    UserProfile,
    | "displayName"
    | "fullName"
    | "username"
    | "avatarUrl"
    | "phone"
    | "dateOfBirth"
    | "gender"
    | "homeCity"
    | "country"
    | "bio"
    | "verificationStatus"
  >
>;

const COLUMN_MAP: Record<string, string> = {
  displayName: "display_name",
  fullName: "full_name",
  username: "username",
  avatarUrl: "avatar_url",
  phone: "phone",
  dateOfBirth: "date_of_birth",
  gender: "gender",
  homeCity: "home_city",
  country: "country",
  bio: "bio",
  verificationStatus: "verification_status",
};

/** Update the current user's own profile (RLS restricts to own row). */
export async function updateProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<UserProfile> {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) updates[COLUMN_MAP[key]] = value;
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

// ── Emergency contacts (all-or-nothing) ──────────────────────────────

export async function setEmergencyContact(
  userId: string,
  contact: EmergencyContact,
): Promise<UserProfile> {
  const updates: Record<string, string> = {
    emergency_contact_name: contact.name.trim(),
    emergency_contact_phone: contact.phone.trim(),
    emergency_contact_relationship: contact.relationship.trim(),
  };
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as ProfileRow);
}

export async function clearEmergencyContact(userId: string): Promise<UserProfile> {
  const updates: Record<string, null> = {
    emergency_contact_name: null,
    emergency_contact_phone: null,
    emergency_contact_relationship: null,
  };
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as ProfileRow);
}

// ── Public profiles (other users) ────────────────────────────────────

/** View another user's public profile — never exposes private fields. */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("get_public_profile", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data ? mapPublicRow(data as PublicProfileRow) : null;
}

/** Search users by username prefix (for future ride/community features). */
export async function searchProfiles(
  query: string,
  limit = 20,
): Promise<PublicProfile[]> {
  const { data, error } = await supabase.rpc("search_profiles", {
    p_query: query.trim(),
    p_limit: limit,
  });
  if (error) throw error;
  return (data as PublicProfileRow[] | null)?.map(mapPublicRow) ?? [];
}

export { EC_COLUMNS };
