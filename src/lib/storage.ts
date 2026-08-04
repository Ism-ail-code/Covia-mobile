/**
 * Covia Storage — safe AsyncStorage wrappers with error handling.
 * All operations are wrapped in try/catch to prevent storage failures
 * from crashing the app.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/** Safely read a JSON value from AsyncStorage. Returns null on any error. */
export async function safeGetJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Safely write a JSON value to AsyncStorage. Returns true on success. */
export async function safeSetJSON(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Safely remove a key from AsyncStorage. Returns true on success. */
export async function safeRemove(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Safely get all keys from AsyncStorage. Returns empty array on error. */
export async function safeGetAllKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch {
    return [];
  }
}

/** Safely merge a partial JSON object into an existing stored object. */
export async function safeMergeJSON<T extends Record<string, unknown>>(
  key: string,
  partial: Partial<T>,
): Promise<boolean> {
  try {
    const existing = await safeGetJSON<T>(key);
    const merged = { ...(existing ?? {}), ...partial };
    await AsyncStorage.setItem(key, JSON.stringify(merged));
    return true;
  } catch {
    return false;
  }
}

/** Safely read a string value from AsyncStorage. Returns null on error. */
export async function safeGetString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Safely write a string value to AsyncStorage. Returns true on success. */
export async function safeSetString(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
