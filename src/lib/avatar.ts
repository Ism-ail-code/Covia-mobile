/**
 * Covia Avatar — avatar display and generation helpers.
 * Provides initials extraction, color generation, and default avatar logic.
 */

/** Extract initials from a name (max 2 characters). */
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Generate a consistent color from a string (for default avatars). */
export function stringToColor(str: string): string {
  const colors = [
    "#096acb", // primary
    "#00ac7c", // accent
    "#e79c27", // warning
    "#9964e5", // purple
    "#db2a3d", // red
    "#00a86b", // green
    "#e67e22", // orange
    "#3498db", // blue
    "#9b59b6", // violet
    "#1abc9c", // teal
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Get the display name for a user, handling missing fields. */
export function getDisplayName(
  fullName?: string | null,
  email?: string | null,
): string {
  if (fullName?.trim()) return fullName.trim();
  if (email) return email.split("@")[0];
  return "Anonymous";
}

/** Check if an avatar URL is a valid non-empty string. */
export function hasValidAvatar(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.length > 0 && (trimmed.startsWith("http") || trimmed.startsWith("file://"));
}
