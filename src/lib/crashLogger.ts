/**
 * Covia Crash Logging — centralized error reporting abstraction.
 *
 * This module defines the crash logger interface and a local dev implementation.
 * No third-party SDK (Sentry, Bugsnag, etc.) is integrated yet.
 *
 * To integrate Sentry:
 *   1. `npm install @sentry/react-native`
 *   2. Create a SentryCrashLogger class implementing CrashLogger
 *   3. Call `initCrashLogger(new SentryCrashLogger())` at app startup
 *
 * Example:
 *   import { initCrashLogger } from "@/lib/crashLogger";
 *   import { SentryCrashLogger } from "./crashLogger/sentry";
 *   initCrashLogger(new SentryCrashLogger("https://xxx@sentry.io/xxx"));
 */

// ── Provider Interface ─────────────────────────────────────────

export interface CrashLogger {
  /** Log a non-fatal error with optional context. */
  error(error: Error, context?: Record<string, unknown>): void;

  /** Log a warning message with optional context. */
  warn(message: string, context?: Record<string, unknown>): void;

  /** Set the current user identity for crash reports. */
  setUser(userId: string | null, email?: string): void;

  /** Add breadcrumb for debugging. */
  breadcrumb(message: string, category?: string, data?: Record<string, unknown>): void;

  /** Flush any queued reports (call before app backgrounding). */
  flush(): Promise<void>;
}

// ── Default (Dev) Provider ─────────────────────────────────────

class DevCrashLogger implements CrashLogger {
  private userId: string | null = null;

  error(error: Error, context?: Record<string, unknown>) {
    console.error("[crash]", error.message, context ?? "");
  }

  warn(message: string, context?: Record<string, unknown>) {
    console.warn("[crash-warn]", message, context ?? "");
  }

  setUser(userId: string | null, _email?: string) {
    this.userId = userId;
  }

  breadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
    if (__DEV__) {
      console.log(`[breadcrumb:${category ?? "general"}]`, message, data ?? "");
    }
  }

  async flush() {
    // No-op in dev; real provider would flush queued events.
  }
}

// ── Singleton ──────────────────────────────────────────────────

let logger: CrashLogger = new DevCrashLogger();

/** Swap the crash logger provider (call once at app startup). */
export function initCrashLogger(p: CrashLogger) {
  logger = p;
}

/** Log a non-fatal error. */
export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error(error, context);
}

/** Log a warning. */
export function logWarn(message: string, context?: Record<string, unknown>) {
  logger.warn(message, context);
}

/** Set the current user for crash reports. */
export function setCrashUser(userId: string | null, email?: string) {
  logger.setUser(userId, email);
}

/** Add a debugging breadcrumb. */
export function breadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
  logger.breadcrumb(message, category, data);
}

/** Flush queued crash reports. */
export function flushCrashReports() {
  return logger.flush();
}

// ── Global Error Handler ───────────────────────────────────────

/** Install a global handler for unhandled JS errors and unhandled promise rejections. */
export function installGlobalErrorHandler() {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    logger.error(error, { isFatal: isFatal ?? false });
    // Call the original handler (shows red box in dev)
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}
