/**
 * Verification models.
 *
 * Mirrors the Phase 4 Supabase schema (0005_verification_schema.sql):
 * one `verification_submissions` row per type (government_id | student)
 * with the status lifecycle
 *   pending → approved | rejected | resubmission_requested
 * plus `expired` for stale documents.
 *
 * Email confirmation is the only *account* verification method; the
 * phone number is collected as a contact field and is never verified.
 * WhatsApp/SMS verification can be added in a future phase on top of
 * `profiles.phone` without touching these doc types.
 */

export type VerificationType = "government_id" | "student";

export type Verification = "id" | "student" | "email";

export type GovernmentIdKind = "national_id" | "drivers_license" | "passport";

export type VerificationSubmissionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "resubmission_requested";

export const GOVERNMENT_ID_KINDS: { value: GovernmentIdKind; label: string }[] = [
  { value: "national_id", label: "National ID" },
  { value: "drivers_license", label: "Driver's licence" },
  { value: "passport", label: "Passport" },
];

export const VERIFICATION_TYPES: { value: VerificationType; label: string }[] = [
  { value: "government_id", label: "Government ID" },
  { value: "student", label: "Student ID" },
];

/** Private storage bucket holding verification document objects. */
export const VERIFICATION_DOCUMENTS_BUCKET = "verification-documents";

/**
 * A submission as returned by get_my_verification / submit_verification.
 * Document fields hold object paths inside the private
 * `verification-documents` bucket — never public URLs (0006 migration).
 */
export type VerificationSubmission = {  id: string;
  userId: string;
  verificationType: VerificationType;
  governmentIdKind: GovernmentIdKind | null;
  status: VerificationSubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  frontDocumentPath: string | null;
  backDocumentPath: string | null;
  selfiePath: string | null;
  studentCardPath: string | null;
  universityEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

/** A locally picked document that has not been uploaded yet. */
export type VerificationDraft = {
  slot: "front" | "back" | "selfie" | "student_card";
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};
