/**
 * Covia Profile Helpers — profile display and validation utilities.
 */

/** Get a label for a profile field. */
export function getProfileFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    fullName: "Full Name",
    username: "Username",
    email: "Email",
    phone: "Phone",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    bio: "Bio",
    avatar: "Profile Photo",
    emergencyContact: "Emergency Contact",
  };
  return labels[field] ?? field;
}

/** Get a label for a gender value. */
export function getGenderLabel(gender: string): string {
  const labels: Record<string, string> = {
    male: "Male",
    female: "Female",
    non_binary: "Non-binary",
    prefer_not_to_say: "Prefer not to say",
    other: "Other",
  };
  return labels[gender] ?? gender;
}

/** Format a date of birth for display. */
export function formatDateOfBirth(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Check if a profile is complete (all required fields filled). */
export function isProfileComplete(profile: {
  fullName?: string | null;
  username?: string | null;
  phone?: string | null;
}): boolean {
  return !!(profile.fullName?.trim() && profile.username?.trim() && profile.phone?.trim());
}

/** Get a completion percentage for a profile. */
export function getProfileCompletionPercentage(profile: {
  fullName?: string | null;
  username?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bio?: string | null;
}): number {
  const fields = [
    profile.fullName?.trim(),
    profile.username?.trim(),
    profile.phone?.trim(),
    profile.dateOfBirth?.trim(),
    profile.gender?.trim(),
    profile.bio?.trim(),
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/** Validate a bio length. */
export function validateBio(bio: string): string | null {
  if (bio.length > 200) return "Bio must be 200 characters or less.";
  return null;
}
