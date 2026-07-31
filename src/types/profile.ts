/**
 * User profile contract.
 *
 * The profile row lives in Supabase Postgres (`public.profiles`) and is
 * created automatically when a user signs up (DB trigger + client-side
 * fallback). Columns are snake_case in the database and mapped to
 * camelCase here (see src/services/profiles.ts).
 */

export type VerificationStatus = "Pending" | "In Review" | "Verified" | "Rejected";

export type UserProfile = {
  id: string;
  email: string | null;
  /** Public display name (falls back to full name or email prefix). */
  displayName: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  homeCity: string | null;
  bio: string | null;
  /** Document-verification status; defaults to "Pending" on signup. */
  verificationStatus: VerificationStatus;
  /** Default 5.0 until the user has been rated. */
  rating: number;
  /** Default 90 until real reliability data exists. */
  reliabilityScore: number;
  /** Verified government ID (driving licence / national ID / passport). */
  isGovernmentIdVerified: boolean;
  /** Verified student status (unlocks students-only rides). */
  isStudentVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Fields a fresh account gets by default (mirrors the DB trigger). */
export const DEFAULT_PROFILE = {
  verificationStatus: "Pending",
  rating: 5.0,
  reliabilityScore: 90,
  isGovernmentIdVerified: false,
  isStudentVerified: false,
} as const;
