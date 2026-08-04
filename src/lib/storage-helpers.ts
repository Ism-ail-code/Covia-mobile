/**
 * Covia Storage Helpers — Supabase Storage upload and URL utilities.
 */

import { STORAGE_BUCKETS } from "./constants";

/** Get the bucket name for a storage category. */
export function getStorageBucket(category: "avatar" | "verification" | "feedback" | "ride"): string {
  switch (category) {
    case "avatar":
      return STORAGE_BUCKETS.AVATARS;
    case "verification":
      return STORAGE_BUCKETS.VERIFICATION_DOCS;
    case "feedback":
      return STORAGE_BUCKETS.FEEDBACK_SCREENSHOTS;
    case "ride":
      return STORAGE_BUCKETS.RIDE_MEDIA;
  }
}

/** Generate a storage path for an avatar upload. */
export function getAvatarPath(userId: string, extension: string = "jpg"): string {
  return `${userId}/avatar.${extension}`;
}

/** Generate a storage path for a verification document. */
export function getVerificationDocPath(
  userId: string,
  documentType: string,
  extension: string = "jpg",
): string {
  return `${userId}/${documentType}.${extension}`;
}

/** Generate a storage path for a feedback screenshot. */
export function getFeedbackScreenshotPath(
  feedbackId: string,
  extension: string = "jpg",
): string {
  return `${feedbackId}/screenshot.${extension}`;
}

/** Generate a storage path for ride media. */
export function getRideMediaPath(
  rideId: string,
  filename: string,
): string {
  return `${rideId}/${filename}`;
}

/** Validate that a file extension is allowed for upload. */
export function isAllowedFileExtension(filename: string): boolean {
  const allowed = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return allowed.includes(ext);
}

/** Get the MIME type for a file extension. */
export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
  };
  return mimeTypes[ext] ?? "application/octet-stream";
}
