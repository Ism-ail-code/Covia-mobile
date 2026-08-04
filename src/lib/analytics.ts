/**
 * Covia Analytics — centralized event tracking abstraction.
 *
 * This module defines the analytics interface and event schema.
 * No third-party SDK is integrated yet. The current implementation
 * logs events locally (console in dev, array in memory).
 *
 * To integrate PostHog, Mixpanel, Amplitude, or Firebase Analytics:
 *   1. Create a new provider class implementing AnalyticsProvider
 *   2. Call `initAnalytics(new YourProvider())` at app startup
 *
 * Example:
 *   import { initAnalytics } from "@/lib/analytics";
 *   import { PostHogProvider } from "./analytics/posthog";
 *   initAnalytics(new PostHogProvider("phc_xxx"));
 */

// ── Event Definitions ──────────────────────────────────────────

export type AnalyticsEvent =
  // Auth
  | { event: "signup_success"; properties: { method: string } }
  | { event: "signup_failed"; properties: { error: string } }
  | { event: "login_success"; properties: { method: string } }
  | { event: "login_failed"; properties: { error: string } }
  | { event: "logout" }
  | { event: "password_reset_requested" }
  | { event: "email_verified" }

  // Rides
  | { event: "ride_created"; properties: { rideId: string; fareMode: string } }
  | { event: "ride_updated"; properties: { rideId: string } }
  | { event: "ride_cancelled"; properties: { rideId: string } }
  | { event: "ride_joined"; properties: { rideId: string } }
  | { event: "ride_left"; properties: { rideId: string } }
  | { event: "ride_started"; properties: { rideId: string } }
  | { event: "ride_completed"; properties: { rideId: string } }
  | { event: "ride_searched"; properties: { filters: Record<string, unknown> } }

  // Chat
  | { event: "message_sent"; properties: { chatId: string } }
  | { event: "chat_opened"; properties: { chatId: string } }

  // Notifications
  | { event: "notification_opened"; properties: { notificationId: string; type: string } }
  | { event: "notification_deleted"; properties: { notificationId: string } }

  // Verification
  | { event: "verification_submitted"; properties: { type: string } }
  | { event: "verification_approved"; properties: { submissionId: string } }
  | { event: "verification_rejected"; properties: { submissionId: string } }

  // Profile
  | { event: "profile_updated"; properties: { fields: string[] } }
  | { event: "avatar_uploaded" }

  // Safety
  | { event: "sos_triggered"; properties: { rideId?: string } }
  | { event: "emergency_contact_added" }
  | { event: "safety_check_completed"; properties: { rideId: string } }

  // Ratings
  | { event: "rating_submitted"; properties: { rideId: string; rating: number } }

  // Feedback
  | { event: "feedback_submitted"; properties: { category: string } }

  // Admin
  | { event: "admin_user_suspended"; properties: { userId: string } }
  | { event: "admin_user_banned"; properties: { userId: string } }
  | { event: "admin_ride_cancelled"; properties: { rideId: string } }
  | { event: "admin_verification_reviewed"; properties: { submissionId: string; action: string } };

export type AnalyticsEventType = AnalyticsEvent["event"];

// ── Provider Interface ─────────────────────────────────────────

export interface AnalyticsProvider {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}

// ── Default (Dev) Provider ─────────────────────────────────────

class DevAnalyticsProvider implements AnalyticsProvider {
  private events: Array<{ event: string; properties?: Record<string, unknown>; timestamp: number }> = [];

  track(event: string, properties?: Record<string, unknown>) {
    const entry = { event, properties, timestamp: Date.now() };
    this.events.push(entry);
    if (__DEV__) {
      console.log(`[analytics] ${event}`, properties ?? "");
    }
  }

  identify(_userId: string, _traits?: Record<string, unknown>) {
    if (__DEV__) {
      console.log(`[analytics] identify: ${_userId}`);
    }
  }

  reset() {
    this.events = [];
  }

  /** Retrieve all tracked events (useful for testing/debugging). */
  getEvents() {
    return [...this.events];
  }
}

// ── Singleton ──────────────────────────────────────────────────

let provider: AnalyticsProvider = new DevAnalyticsProvider();

/** Swap the analytics provider (call once at app startup). */
export function initAnalytics(p: AnalyticsProvider) {
  provider = p;
}

/** Track an analytics event. */
export function track<E extends AnalyticsEvent>(
  ...args: E["event"] extends string
    ? E extends { properties: infer P }
      ? [event: E["event"], P]
      : [event: E["event"]]
    : never
) {
  const [event, properties] = args as [string, Record<string, unknown> | undefined];
  provider.track(event, properties);
}

/** Identify the current user (call after login). */
export function identify(userId: string, traits?: Record<string, unknown>) {
  provider.identify(userId, traits);
}

/** Reset analytics identity (call on logout). */
export function resetAnalytics() {
  provider.reset();
}
