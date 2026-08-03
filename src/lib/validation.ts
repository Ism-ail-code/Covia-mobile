/**
 * Client-side validation helpers for the auth flows and profile editing.
 * Supabase enforces server-side rules too; these give instant feedback.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Strong password: 8+ chars with upper, lower, digit and symbol. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Add at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Add at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Add at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Add at least one symbol (e.g. !@#).";
  }
  return null;
}

// ── Username rules (must match the DB check in 0002_profile_identity.sql) ──
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/** Returns a friendly error message, or null when the username is valid. */
export function validateUsername(username: string): string | null {
  const value = username.trim().toLowerCase();
  if (value.length < 3 || value.length > 20) {
    return "Usernames must be 3–20 characters long.";
  }
  if (!USERNAME_PATTERN.test(value)) {
    return "Use only lowercase letters, numbers and underscores (no spaces).";
  }
  return null;
}

// ── Phone numbers (contact field — collected, never verified) ──
export const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

/** Format check only — Covia never verifies phone numbers. */
export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone.trim());
}

/** Returns a friendly error message, or null when the phone is valid. */
export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Enter your phone number.";
  if (!isValidPhone(phone)) return "Enter a valid phone number (7–20 digits).";
  return null;
}

// ── Emergency contacts ──
export function isValidEmergencyContactPhone(phone: string): boolean {
  return isValidPhone(phone);
}

export function validateEmergencyContact(input: {
  name: string;
  phone: string;
  relationship: string;
}): string | null {
  if (!input.name.trim()) return "Enter the contact's name.";
  if (input.name.trim().length > 60) return "Name is too long.";
  if (!isValidEmergencyContactPhone(input.phone)) {
    return "Enter a valid phone number (7–20 digits).";
  }
  if (!input.relationship.trim()) return "Add how you know this person (e.g. Parent, Friend).";
  if (input.relationship.trim().length > 40) return "Relationship is too long.";
  return null;
}
