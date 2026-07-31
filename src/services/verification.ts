/**
 * Verification service — government ID + student status checks.
 *
 * Talks to the Phase 4 Supabase backend (migrations 0005–0008):
 *   - documents upload to the PRIVATE `verification-documents` bucket at
 *     `verification/<user-id>/...`; only their object paths are stored
 *     on the submission, never public URLs
 *   - submission state lives in `verification_submissions`, reached only
 *     through RPCs: submit_verification / resubmit_verification /
 *     get_my_verification
 *   - the ride-creation gate reads is_user_verified()
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  GovernmentIdKind,
  VerificationSubmission,
  VerificationType,
} from "../types/verification";

export const VERIFICATION_BUCKET = "verification-documents";
export const MAX_VERIFICATION_BYTES = 10 * 1024 * 1024; // 10 MB (bucket limit)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class VerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerificationError";
  }
}

export type DocumentSource = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

/** Image type/size rules — mirrored by the bucket's allowed_mime_types. */
export function validateVerificationDocument(source: DocumentSource): string | null {
  if (source.fileSize != null && source.fileSize > MAX_VERIFICATION_BYTES) {
    return "Documents must be 10 MB or smaller.";
  }
  const mime = (source.mimeType ?? "").toLowerCase();
  if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
    return "Use a JPEG, PNG or WebP image.";
  }
  return null;
}

function extForMime(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

type SubmissionRow = {
  id: string;
  user_id: string;
  verification_type: VerificationType;
  government_id_kind: GovernmentIdKind | null;
  status: VerificationSubmission["status"];
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  front_document_url: string | null;
  back_document_url: string | null;
  selfie_url: string | null;
  student_card_url: string | null;
  university_email: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: SubmissionRow): VerificationSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    verificationType: row.verification_type,
    governmentIdKind: row.government_id_kind,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
    frontDocumentPath: row.front_document_url,
    backDocumentPath: row.back_document_url,
    selfiePath: row.selfie_url,
    studentCardPath: row.student_card_url,
    universityEmail: row.university_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Upload one document into the user's private verification folder.
 * Returns the object path to store on the submission.
 */
export async function uploadVerificationDocument(
  userId: string,
  slot: "front" | "back" | "selfie" | "student_card",
  source: DocumentSource,
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new VerificationError(
      "Verification isn't available yet — add your Supabase keys to .env.",
    );
  }

  const validationError = validateVerificationDocument(source);
  if (validationError) throw new VerificationError(validationError);

  const mime =
    source.mimeType && ALLOWED_MIME_TYPES.includes(source.mimeType.toLowerCase())
      ? source.mimeType
      : "image/jpeg";
  const objectPath = `verification/${userId}/${slot}-${Date.now()}.${extForMime(mime)}`;

  const blob = await fetch(source.uri).then((res) => res.blob()).catch(() => null);
  if (!blob) {
    throw new VerificationError("Couldn't read the selected image — try another one.");
  }

  const { error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .upload(objectPath, blob, { upsert: false, contentType: mime });

  if (error) {
    throw new VerificationError("Upload failed — please try again.");
  }
  return objectPath;
}

/** Delete an uploaded document (best-effort, own folder only). */
export async function deleteVerificationDocument(objectPath: string | null): Promise<void> {
  if (!objectPath) return;
  await supabase.storage
    .from(VERIFICATION_BUCKET)
    .remove([objectPath])
    .catch(() => undefined);
}

export type VerificationInput = {
  type: VerificationType;
  front?: string | null;
  back?: string | null;
  selfie?: string | null;
  studentCard?: string | null;
  universityEmail?: string | null;
  governmentIdKind?: GovernmentIdKind | null;
};

function toVerificationError(error: unknown): VerificationError {
  const message = (error as { message?: string })?.message ?? "";
  const code = (error as { code?: string })?.code ?? "";
  if (code === "23505" || message.includes("active ")) {
    return new VerificationError("You already have a verification in progress — wait for the review.");
  }
  if (message.includes("front of your ID")) {
    return new VerificationError("Add a photo of the front of your ID.");
  }
  if (message.includes("student card or provide")) {
    return new VerificationError("Upload your student card or add your university email.");
  }
  if (message.includes("type of ID")) {
    return new VerificationError("Choose the ID type you're uploading.");
  }
  if (message.includes("Only rejected")) {
    return new VerificationError("Only rejected requests can be resubmitted.");
  }
  return new VerificationError("Couldn't submit — please try again.");
}

/** Start a new verification. The caller must be signed in. */
export async function submitVerification(input: VerificationInput): Promise<VerificationSubmission> {
  if (!isSupabaseConfigured) {
    throw new VerificationError(
      "Verification isn't available yet — add your Supabase keys to .env.",
    );
  }
  const { data, error } = await supabase.rpc("submit_verification", {
    p_verification_type: input.type,
    p_front_document_url: input.front ?? null,
    p_back_document_url: input.back ?? null,
    p_selfie_url: input.selfie ?? null,
    p_student_card_url: input.studentCard ?? null,
    p_university_email: input.universityEmail ?? null,
    p_government_id_kind: input.governmentIdKind ?? null,
  });
  if (error) throw toVerificationError(error);
  return mapRow(data as SubmissionRow);
}

/** Re-upload documents after a rejection / re-upload request. */
export async function resubmitVerification(
  submissionId: string,
  input: VerificationInput,
): Promise<VerificationSubmission> {
  if (!isSupabaseConfigured) {
    throw new VerificationError(
      "Verification isn't available yet — add your Supabase keys to .env.",
    );
  }
  const { data, error } = await supabase.rpc("resubmit_verification", {
    p_submission_id: submissionId,
    p_front_document_url: input.front ?? null,
    p_back_document_url: input.back ?? null,
    p_selfie_url: input.selfie ?? null,
    p_student_card_url: input.studentCard ?? null,
    p_university_email: input.universityEmail ?? null,
    p_government_id_kind: input.governmentIdKind ?? null,
  });
  if (error) throw toVerificationError(error);
  return mapRow(data as SubmissionRow);
}

/** The caller's latest submission for one type, or null when never started. */
export async function getMyVerification(
  type: VerificationType,
): Promise<VerificationSubmission | null> {
  const { data, error } = await supabase.rpc("get_my_verification", {
    p_verification_type: type,
  });
  if (error) throw error;
  return data ? mapRow(data as SubmissionRow) : null;
}

/** True once ANY verification method has been approved (ride gate). */
export async function isUserVerified(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_user_verified");
  if (error) throw error;
  return data === true;
}
