/**
 * Avatar storage service — uploads, replaces and deletes profile photos
 * in the Supabase `avatars` bucket (public, see 0004_avatars_storage.sql).
 *
 * Rules enforced here (mirrored by the bucket's allowed_mime_types and
 * file_size_limit, and by RLS folder policies):
 *   - images only (jpeg/png/webp), max 5 MB
 *   - files live under `avatars/<user-id>/` so users can only touch their
 *     own objects
 *   - only the public URL is stored in the profiles table
 */

import { supabase, isSupabaseConfigured } from "./supabase";

export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB (bucket limit)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class AvatarUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvatarUploadError";
  }
}

export type AvatarSource = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

export function validateAvatar(source: AvatarSource): string | null {
  if (source.fileSize != null && source.fileSize > MAX_AVATAR_BYTES) {
    return "Photos must be 5 MB or smaller.";
  }
  const mime = (source.mimeType ?? "").toLowerCase();
  if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
    return "Use a JPEG, PNG or WebP photo.";
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

/** Remove the object behind a public URL (best-effort, own folder only). */
export async function deleteAvatarObject(publicUrl: string | null): Promise<void> {
  if (!publicUrl) return;
  const path = extractObjectPath(publicUrl);
  if (!path) return;
  await supabase.storage.from(AVATAR_BUCKET).remove([path]).catch(() => undefined);
}

/**
 * Short-lived signed URL for a private bucket object (e.g. the
 * `verification-documents` bucket, whose RLS permits owner + admin
 * reads). Returns null when the path is empty or signing fails.
 */
export async function getPrivateSignedUrl(
  bucket: string,
  objectPath: string | null,
  expiresIn = 300,
): Promise<string | null> {
  if (!objectPath) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

function extractObjectPath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

/**
 * Upload (or replace) the user's avatar.
 *
 * Files are stored at the stable path `avatars/<user-id>/avatar.<ext>` so a
 * new upload replaces the old one (upsert); the previous file is still
 * removed first so switching formats never leaves orphans.
 *
 * Returns the public URL to store in `profiles.avatar_url`.
 */
export async function uploadAvatar(
  userId: string,
  source: AvatarSource,
  previousPublicUrl: string | null,
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new AvatarUploadError(
      "Profile photos aren't available yet — add your Supabase keys to .env.",
    );
  }

  const validationError = validateAvatar(source);
  if (validationError) throw new AvatarUploadError(validationError);

  const mime = source.mimeType && ALLOWED_MIME_TYPES.includes(source.mimeType.toLowerCase())
    ? source.mimeType
    : "image/jpeg";
  const ext = extForMime(mime);
  const objectPath = `${userId}/avatar.${ext}`;

  const blob = await fetch(source.uri).then((res) => res.blob()).catch(() => null);
  if (!blob) {
    throw new AvatarUploadError("Couldn't read the selected photo — try another one.");
  }

  // Remove the previous avatar (different format → different path).
  if (previousPublicUrl) {
    await deleteAvatarObject(previousPublicUrl);
  }

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, blob, { upsert: true, contentType: mime });

  if (error) {
    throw new AvatarUploadError("Photo upload failed — please try again.");
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
