/**
 * Covia Remote Config — centralized configurable values.
 *
 * Provides a simple key-value store for remote configuration.
 * Values are fetched from Supabase and cached locally.
 *
 * Usage:
 *   import { getConfigValue } from "@/lib/remoteConfig";
 *   const maintenance = await getConfigValue("maintenance_mode");
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "../services/supabase";

const STORAGE_KEY = "covia_remote_config";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type ConfigKey =
  | "maintenance_mode"
  | "maintenance_message"
  | "min_app_version"
  | "announcement_title"
  | "announcement_message"
  | "announcement_enabled"
  | "beta_registration_open"
  | "support_email"
  | "feedback_enabled"
  | "max_upload_size_mb"
  | "chat_message_limit"
  | "ride_search_radius_km";

type ConfigEntry = { value: string; fetchedAt: number };

let cache: Record<string, ConfigEntry> = {};

const DEFAULTS: Record<ConfigKey, string> = {
  maintenance_mode: "false",
  maintenance_message: "Covia is currently under maintenance. Please try again later.",
  min_app_version: "1.0.0",
  announcement_title: "",
  announcement_message: "",
  announcement_enabled: "false",
  beta_registration_open: "true",
  support_email: "support@covia.app",
  feedback_enabled: "true",
  max_upload_size_mb: "10",
  chat_message_limit: "500",
  ride_search_radius_km: "15",
};

async function loadCache(): Promise<Record<string, ConfigEntry>> {
  if (Object.keys(cache).length > 0) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache;
}

async function saveCache(c: Record<string, ConfigEntry>) {
  cache = c;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

/** Fetch all remote config values from Supabase (or use cache). */
export async function refreshConfig(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data } = await supabase
      .from("platform_settings" as any)
      .select("key, value")
      .limit(100);
    if (!data) return;
    const now = Date.now();
    const cached = await loadCache();
    for (const row of data as any) {
      cached[row.key] = { value: String(row.value), fetchedAt: now };
    }
    await saveCache(cached);
  } catch {
    // Silently fail — use cached defaults
  }
}

/** Get a config value with optional type coercion. */
export async function getConfigValue<K extends ConfigKey>(key: K): Promise<string> {
  const cached = await loadCache();
  const entry = cached[key];
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.value;
  }
  return DEFAULTS[key] ?? "";
}

/** Get a config value as a boolean. */
export async function getConfigBool(key: ConfigKey): Promise<boolean> {
  const val = await getConfigValue(key);
  return val === "true" || val === "1";
}

/** Get a config value as a number. */
export async function getConfigNumber(key: ConfigKey): Promise<number> {
  const val = await getConfigValue(key);
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/** Set a config value locally (admin override). */
export async function setConfigValue(key: ConfigKey, value: string): Promise<void> {
  const cached = await loadCache();
  cached[key] = { value, fetchedAt: Date.now() };
  await saveCache(cached);
}

/** Check if app version meets minimum requirement. */
export async function isAppVersionSupported(currentVersion: string): Promise<boolean> {
  const minVersion = await getConfigValue("min_app_version");
  if (!minVersion) return true;
  const [cMaj, cMin, cPat] = currentVersion.split(".").map(Number);
  const [mMaj, mMin, mPat] = minVersion.split(".").map(Number);
  if (cMaj !== mMaj) return cMaj > mMaj;
  if (cMin !== mMin) return cMin > mMin;
  return cPat >= mPat;
}
