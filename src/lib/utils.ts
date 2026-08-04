/**
 * Covia Utilities — general-purpose pure helper functions.
 * No side effects, no imports, fully testable.
 */

/** Truncate a string to maxLength and append ellipsis. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "\u2026";
}

/** Capitalize the first letter of a string. */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert a string to title case. */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Generate a short random ID. */
export function randomId(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Deep clone a JSON-serializable value. */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Check if a value is null or undefined. */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Pick specified keys from an object. */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/** Omit specified keys from an object. */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/** Sleep for a given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Check if two arrays have the same elements (shallow comparison). */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

/** Group an array by a key function. */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

/** Remove duplicates from an array. */
export function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/** Remove falsy values from an array. */
export function compact<T>(items: (T | null | undefined | false | 0 | "")[]): T[] {
  return items.filter(Boolean) as T[];
}
