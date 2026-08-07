/**
 * Auth error mapping — converts Supabase / network errors into clear,
 * user-friendly messages for the screens. Never leaks internal details.
 */

import { AuthError } from "@supabase/supabase-js";

type ErrorSource = { message: string; status?: number; code?: string };

/** Known Supabase error code → friendly message. */
const CODE_MESSAGES: Record<string, string> = {
  user_already_exists: "An account with this email already exists. Try logging in instead.",
  email_exists: "An account with this email already exists. Try logging in instead.",
  invalid_credentials: "Incorrect email or password. Please try again.",
  weak_password: "That password is too weak. Use at least 8 characters with a mix of letters, numbers and symbols.",
  email_not_confirmed: "Please verify your email before logging in. We've sent you a verification code.",
  over_email_send_rate_limit: "Too many emails sent. Please wait a minute and try again.",
  over_request_rate_limit: "Too many attempts. Please wait a minute and try again.",
  user_not_found: "No account found with this email.",
  refresh_token_not_found: "Your session has expired. Please log in again.",
  invalid_jwt: "Your session is no longer valid. Please log in again.",
  jwt_expired: "Your session has expired. Please log in again.",
  bad_code_verifier: "This link is invalid or has expired. Please request a new one.",
  bad_json: "Something went wrong on our side. Please try again.",
};

const MESSAGE_FRAGMENTS: Array<[string, string]> = [
  ["Unable to process the request", "Something went wrong. Please try again."],
  ["Network request failed", "You're offline. Check your connection and try again."],
  ["Failed to fetch", "You're offline. Check your connection and try again."],
  ["NetworkError", "You're offline. Check your connection and try again."],
  [
    "Token has expired or is invalid",
    "That code is invalid or has expired. Check your email and try again, or request a new code.",
  ],
  [
    "token has expired or is invalid",
    "That code is invalid or has expired. Check your email and try again, or request a new code.",
  ],
];

export class AuthErrorDisplay extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthErrorDisplay";
  }
}

export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /network request failed|failed to fetch|networkerror|socket|timeout/i.test(err.message);
}

/**
 * Normalize any thrown error into a friendly display message.
 * Falls back to "Something went wrong" for unexpected errors.
 */
export function toFriendlyAuthError(err: unknown): string {
  if (err instanceof AuthErrorDisplay) return err.message;

  if (isNetworkError(err)) {
    return "You're offline. Check your connection and try again.";
  }

  const source: ErrorSource | null =
    err instanceof AuthError
      ? err
      : err instanceof Error && "status" in err
        ? (err as ErrorSource)
        : null;

  if (source) {
    const code = source.code ?? "";
    if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

    const rawMessage = source.message ?? "";
    for (const [fragment, friendly] of MESSAGE_FRAGMENTS) {
      if (rawMessage.includes(fragment)) return friendly;
    }
    if (source.status === 422 && rawMessage.includes("email")) {
      return "That doesn't look like a valid email address.";
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return "Something went wrong. Please try again.";
}
