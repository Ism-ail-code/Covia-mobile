/**
 * Covia Analytics Helpers — event name and property formatting utilities.
 * Used to standardize analytics event names and property keys.
 */

/** Convert a snake_case string to a readable label. */
export function eventToLabel(event: string): string {
  return event
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Sanitize an analytics property value for logging. */
export function sanitizePropertyValue(value: unknown): string | number | boolean {
  if (typeof value === "string") return value.slice(0, 200);
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  return String(value);
}

/** Build a properties object from key-value pairs (filters out null/undefined). */
export function buildProperties(
  ...entries: Array<[string, unknown]>
): Record<string, string | number | boolean> {
  const props: Record<string, string | number | boolean> = {};
  for (const [key, value] of entries) {
    if (value !== null && value !== undefined) {
      props[key] = sanitizePropertyValue(value);
    }
  }
  return props;
}

/** Get the current timestamp for analytics. */
export function getAnalyticsTimestamp(): string {
  return new Date().toISOString();
}

/** Generate a session ID for grouping events. */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
