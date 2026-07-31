/**
 * Client-side validation helpers for the auth flows.
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
