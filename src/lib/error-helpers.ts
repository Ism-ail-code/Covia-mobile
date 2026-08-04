/**
 * Covia Error Helpers — centralized error handling utilities.
 * Provides consistent error extraction, formatting, and user-friendly messages.
 */

/** Extract a readable error message from any error type. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unexpected error occurred.";
}

/** Extract a user-friendly error message from Supabase/RPC errors. */
export function getUserFriendlyMessage(error: unknown): string {
  const msg = getErrorMessage(error);

  // Common Supabase error patterns
  if (msg.includes("Invalid login credentials")) return "Invalid email or password.";
  if (msg.includes("Email not confirmed")) return "Please verify your email first.";
  if (msg.includes("User already registered")) return "This email is already registered.";
  if (msg.includes("Password should be")) return "Password does not meet requirements.";
  if (msg.includes("rate limit")) return "Too many attempts. Please try again later.";
  if (msg.includes("Network request failed")) return "No internet connection.";
  if (msg.includes("timeout")) return "Request timed out. Please try again.";

  // RPC error patterns
  if (msg.includes("permission denied")) return "You don't have permission for this action.";
  if (msg.includes("not found")) return "The requested resource was not found.";
  if (msg.includes("already exists")) return "This item already exists.";

  return msg || "Something went wrong. Please try again.";
}

/** Check if an error is a network error. */
export function isNetworkError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("connection") ||
    msg.includes("offline")
  );
}

/** Check if an error is a timeout error. */
export function isTimeoutError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return msg.includes("timeout") || msg.includes("timed out");
}

/** Check if an error is an auth error. */
export function isAuthError(error: unknown): boolean {
  const msg = getErrorMessage(error).toLowerCase();
  return (
    msg.includes("unauthorized") ||
    msg.includes("invalid token") ||
    msg.includes("session") ||
    msg.includes("auth")
  );
}

/** Format an error for logging (safe for console). */
export function formatErrorForLog(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: __DEV__ ? error.stack : undefined,
    };
  }
  return { message: String(error) };
}
