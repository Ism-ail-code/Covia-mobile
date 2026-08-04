/**
 * Covia Feature Flags — simple on/off feature toggles.
 *
 * Flags are stored locally in AsyncStorage and can be synced from
 * a remote config backend in the future.
 *
 * Usage:
 *   import { isFeatureEnabled, setFeatureFlag } from "@/lib/featureFlags";
 *   if (await isFeatureEnabled("smart_fare")) { ... }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "covia_feature_flags";

export type FeatureFlag =
  | "whatsapp_verification"
  | "smart_fare"
  | "standby_pool"
  | "ai_matching"
  | "push_notifications"
  | "image_compression"
  | "offline_mode"
  | "ride_scheduling"
  | "group_booking"
  | "driver_verification";

/** Default flag values (all disabled unless explicitly enabled). */
const DEFAULTS: Record<FeatureFlag, boolean> = {
  whatsapp_verification: false,
  smart_fare: false,
  standby_pool: false,
  ai_matching: false,
  push_notifications: false,
  image_compression: false,
  offline_mode: false,
  ride_scheduling: false,
  group_booking: false,
  driver_verification: false,
};

let cache: Record<string, boolean> = {};

async function loadFlags(): Promise<Record<string, boolean>> {
  if (Object.keys(cache).length > 0) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

/** Check if a feature flag is enabled. */
export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  const flags = await loadFlags();
  return flags[flag] ?? DEFAULTS[flag] ?? false;
}

/** Set a feature flag value. */
export async function setFeatureFlag(flag: FeatureFlag, enabled: boolean): Promise<void> {
  const flags = await loadFlags();
  flags[flag] = enabled;
  cache = flags;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

/** Get all flag values (for admin/debug UI). */
export async function getAllFlags(): Promise<Record<FeatureFlag, boolean>> {
  const flags = await loadFlags();
  return { ...DEFAULTS, ...flags } as Record<FeatureFlag, boolean>;
}

/** Reset all flags to defaults. */
export async function resetFlags(): Promise<void> {
  cache = { ...DEFAULTS };
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Bulk set multiple flags (for remote config sync). */
export async function syncFlags(updates: Partial<Record<FeatureFlag, boolean>>): Promise<void> {
  const flags = await loadFlags();
  Object.assign(flags, updates);
  cache = flags;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}
