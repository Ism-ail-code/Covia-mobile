/**
 * Covia App Constants — shared magic numbers and strings.
 * Centralizes values used across multiple screens and services.
 */

/** AsyncStorage keys used across the app. */
export const STORAGE_KEYS = {
  LOGS: "covia_logs",
  FEEDBACK: "covia_feedback",
  FEATURE_FLAGS: "covia_feature_flags",
  REMOTE_CONFIG: "covia_remote_config",
  USER_PREFERENCES: "covia_user_prefs",
  ONBOARDING_COMPLETE: "covia_onboarding_done",
} as const;

/** Pagination defaults. */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  MIN_PAGE_SIZE: 5,
} as const;

/** Time durations in milliseconds. */
export const DURATIONS = {
  /** Remote config cache TTL. */
  CONFIG_CACHE_TTL: 5 * 60 * 1000,
  /** Debounce delay for search inputs. */
  SEARCH_DEBOUNCE: 300,
  /** Auto-refresh interval for live screens. */
  LIVE_REFRESH_INTERVAL: 15_000,
  /** Polling interval for chat messages. */
  CHAT_POLL_INTERVAL: 5_000,
  /** Splash screen minimum display time. */
  SPLASH_MIN_DURATION: 1500,
} as const;

/** Validation limits. */
export const LIMITS = {
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  MAX_USERNAME_LENGTH: 20,
  MIN_USERNAME_LENGTH: 3,
  MAX_PHONE_DIGITS: 15,
  MIN_PHONE_DIGITS: 7,
  MAX_NAME_LENGTH: 60,
  MAX_RELATIONSHIP_LENGTH: 40,
  MAX_CHAT_MESSAGE_LENGTH: 500,
  MAX_FEEDBACK_DESCRIPTION_LENGTH: 2000,
  MAX_SEARCH_QUERY_LENGTH: 100,
} as const;

/** Supabase storage bucket names. */
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  VERIFICATION_DOCS: "verification-documents",
  FEEDBACK_SCREENSHOTS: "feedback-screenshots",
  RIDE_MEDIA: "ride-media",
} as const;

/** Platform-specific constants. */
export const PLATFORM = {
  IOS: "ios" as const,
  ANDROID: "android" as const,
  WEB: "web" as const,
} as const;
