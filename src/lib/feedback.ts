/**
 * Covia Feedback — in-app bug reports, feature suggestions, and feedback.
 *
 * Stores feedback locally and syncs to Supabase when online.
 * Attaches device diagnostics automatically.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { collectDiagnostics, type DeviceDiagnostics } from "./diagnostics";

export type FeedbackCategory = "bug" | "feature" | "ui_issue" | "general";

export type FeedbackEntry = {
  id: string;
  category: FeedbackCategory;
  description: string;
  screenshotUri?: string;
  appVersion: string;
  deviceInfo: DeviceDiagnostics;
  userId?: string;
  createdAt: string;
  synced: boolean;
};

const STORAGE_KEY = "covia_feedback";

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Submit a feedback entry. Stores locally, syncs to Supabase if online. */
export async function submitFeedback(input: {
  category: FeedbackCategory;
  description: string;
  screenshotUri?: string;
  userId?: string;
}): Promise<FeedbackEntry> {
  const diagnostics = await collectDiagnostics();
  const entry: FeedbackEntry = {
    id: generateId(),
    category: input.category,
    description: input.description,
    screenshotUri: input.screenshotUri,
    appVersion: diagnostics.appVersion,
    deviceInfo: diagnostics,
    userId: input.userId,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  // Persist locally
  const entries = await getFeedbackEntries();
  entries.push(entry);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

  // Try to sync to Supabase
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from("feedback_reports" as any).insert({
        id: entry.id,
        category: entry.category,
        description: entry.description,
        screenshot_url: entry.screenshotUri ?? null,
        app_version: entry.appVersion,
        device_info: entry.deviceInfo,
        user_id: entry.userId ?? null,
        created_at: entry.createdAt,
      });
      if (!error) {
        entry.synced = true;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      }
    } catch {
      // Will retry later
    }
  }

  return entry;
}

/** Get all locally stored feedback entries. */
export async function getFeedbackEntries(): Promise<FeedbackEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Get count of unsynced feedback entries. */
export async function getUnsyncedCount(): Promise<number> {
  const entries = await getFeedbackEntries();
  return entries.filter((e) => !e.synced).length;
}

/** Clear all locally stored feedback. */
export async function clearFeedback(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
