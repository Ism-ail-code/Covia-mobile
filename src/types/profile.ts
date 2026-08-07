/**
 * Profile models.
 *
 * There are exactly two surfaces:
 *   - UserProfile (private)   — full row, only ever fetched/updated by the
 *     owner; RLS restricts the table to own-row access.
 *   - PublicProfile           — what other users can see (the
 *     `public_profiles` view in Supabase). Never contains email, phone,
 *     date of birth, gender or emergency contact data.
 */

export type VerificationStatus = "Pending" | "In Review" | "Verified" | "Rejected";

/**
 * Onboarding lifecycle, persisted on the profile row (migration 0044)
 * so reinstalls can't bypass it:
 *   onboard  → post-verification welcome screens
 *   profile  → profile setup (create-profile)
 *   verify   → identity verification introduction
 *   complete → normal app (tabs)
 */
export type OnboardingStep = "onboard" | "profile" | "verify" | "complete";

export const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"] as const;
export type Gender = (typeof GENDERS)[number];

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  /** Private — never exposed on public profiles. */
  phone: string | null;
  /** Private — ISO date (yyyy-mm-dd), nullable. */
  dateOfBirth: string | null;
  /** Private — nullable. */
  gender: Gender | null;
  homeCity: string | null;
  country: string | null;
  bio: string | null;
  verificationStatus: VerificationStatus;
  rating: number;
  reliabilityScore: number;
  /** Placeholders — calculated by the rides feature (Phase 4+). */
  totalCompletedRides: number;
  totalCancelledRides: number;
  isGovernmentIdVerified: boolean;
  isStudentVerified: boolean;
  /** Where the user is in the onboarding lifecycle. */
  onboardingStep: OnboardingStep;
  /** Mirrors onboardingStep === "complete". */
  onboardingCompleted: boolean;
  /** Private — all-or-nothing. */
  emergencyContact: EmergencyContact | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * The public profile — only fields a non-owner may see.
 * Mirrors the `public_profiles` view columns.
 */
export type PublicProfile = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  overallRating: number;
  reliabilityScore: number;
  totalCompletedRides: number;
  totalCancelledRides: number;
  verificationStatus: VerificationStatus;
  isGovernmentIdVerified: boolean;
  isStudentVerified: boolean;
  createdAt: string;
};

export const DEFAULT_PROFILE: Pick<
  UserProfile,
  | "verificationStatus"
  | "rating"
  | "reliabilityScore"
  | "totalCompletedRides"
  | "totalCancelledRides"
  | "isGovernmentIdVerified"
  | "isStudentVerified"
> = {
  verificationStatus: "Pending",
  rating: 5.0,
  reliabilityScore: 90,
  totalCompletedRides: 0,
  totalCancelledRides: 0,
  isGovernmentIdVerified: false,
  isStudentVerified: false,
};

/** Default onboarding step for a brand-new profile row. */
export const DEFAULT_ONBOARDING_STEP: OnboardingStep = "onboard";
