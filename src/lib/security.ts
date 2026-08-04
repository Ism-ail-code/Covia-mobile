/**
 * Covia Security — client-side security helpers.
 * Input sanitization, token management, and secure storage wrappers.
 */

/** Sanitize user input by trimming and removing dangerous characters. */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Strip angle brackets
    .replace(/javascript:/gi, "") // Strip JS protocol
    .replace(/on\w+=/gi, ""); // Strip inline event handlers
}

/** Validate that a string is a safe URL (no javascript: protocol). */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("javascript:")) return false;
  if (trimmed.startsWith("data:")) return false;
  if (trimmed.startsWith("vbscript:")) return false;
  return true;
}

/** Generate a random nonce for CSRF-like protection. */
export function generateNonce(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/** Hash a string using SHA-256 (for client-side fingerprinting). */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Mask an email for display: "a***@example.com". */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 5))}@${domain}`;
}

/** Mask a phone number for display: "+234***1234". */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  const prefix = phone.startsWith("+") ? "+" : "";
  const first3 = digits.slice(0, 3);
  const last4 = digits.slice(-4);
  const masked = "*".repeat(Math.max(digits.length - 7, 3));
  return `${prefix}${first3}${masked}${last4}`;
}
