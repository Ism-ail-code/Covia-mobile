/**
 * Covia Logger — structured logging with severity levels.
 *
 * Provides debug, info, warn, and error levels. Logs are stored
 * locally and can be sent to a remote collection endpoint in the future.
 *
 * Usage:
 *   import { log } from "@/lib/logger";
 *   log.info("User signed in", { userId: "abc" });
 *   log.error("Chat send failed", { chatId, error: err.message });
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
};

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MAX_ENTRIES = 500;
const STORAGE_KEY = "covia_logs";
let minLevel: LogLevel = __DEV__ ? "debug" : "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function formatEntry(entry: LogEntry): string {
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${ctx}`;
}

async function persist(entry: LogEntry) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const entries: LogEntry[] = raw ? JSON.parse(raw) : [];
    entries.push(entry);
    // Keep only the last MAX_ENTRIES
    if (entries.length > MAX_ENTRIES) {
      entries.splice(0, entries.length - MAX_ENTRIES);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage failure should not break logging
  }
}

function emit(entry: LogEntry) {
  const formatted = formatEntry(entry);
  switch (entry.level) {
    case "debug":
      console.log(formatted);
      break;
    case "info":
      console.log(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
  void persist(entry);
}

export const log = {
  debug(message: string, context?: Record<string, unknown>) {
    if (!shouldLog("debug")) return;
    emit({ level: "debug", message, context, timestamp: new Date().toISOString() });
  },

  info(message: string, context?: Record<string, unknown>) {
    if (!shouldLog("info")) return;
    emit({ level: "info", message, context, timestamp: new Date().toISOString() });
  },

  warn(message: string, context?: Record<string, unknown>) {
    if (!shouldLog("warn")) return;
    emit({ level: "warn", message, context, timestamp: new Date().toISOString() });
  },

  error(message: string, context?: Record<string, unknown>) {
    if (!shouldLog("error")) return;
    emit({ level: "error", message, context, timestamp: new Date().toISOString() });
  },

  /** Set minimum log level. */
  setMinLevel(level: LogLevel) {
    minLevel = level;
  },

  /** Get all stored log entries. */
  async getEntries(): Promise<LogEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /** Get entries filtered by level. */
  async getEntriesByLevel(level: LogLevel): Promise<LogEntry[]> {
    const entries = await log.getEntries();
    return entries.filter((e) => e.level === level);
  },

  /** Clear all stored log entries. */
  async clear() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },

  /** Export logs as a string (for bug reports). */
  async exportLogs(): Promise<string> {
    const entries = await log.getEntries();
    return entries.map(formatEntry).join("\n");
  },
};
