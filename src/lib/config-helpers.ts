/**
 * Covia Config Helpers — remote config display and transformation utilities.
 */

/** Get a label for a config key. */
export function getConfigKeyLabel(key: string): string {
  const labels: Record<string, string> = {
    maintenance_mode: "Maintenance Mode",
    maintenance_message: "Maintenance Message",
    min_app_version: "Minimum App Version",
    announcement_title: "Announcement Title",
    announcement_message: "Announcement Message",
    announcement_enabled: "Announcements Enabled",
    beta_registration_open: "Beta Registration Open",
    support_email: "Support Email",
    feedback_enabled: "Feedback Enabled",
    max_upload_size_mb: "Max Upload Size (MB)",
    chat_message_limit: "Chat Message Limit",
    ride_search_radius_km: "Ride Search Radius (km)",
  };
  return labels[key] ?? key;
}

/** Get a description for a config key. */
export function getConfigKeyDescription(key: string): string {
  const descriptions: Record<string, string> = {
    maintenance_mode: "When enabled, users see a maintenance screen.",
    maintenance_message: "The message shown during maintenance.",
    min_app_version: "Older app versions will be prompted to update.",
    announcement_title: "Title of the in-app announcement banner.",
    announcement_message: "Body text of the announcement.",
    announcement_enabled: "Show the announcement banner to users.",
    beta_registration_open: "Allow new sign-ups during the beta phase.",
    support_email: "Email address for user support inquiries.",
    feedback_enabled: "Allow users to submit in-app feedback.",
    max_upload_size_mb: "Maximum file size for image uploads.",
    chat_message_limit: "Maximum characters per chat message.",
    ride_search_radius_km: "Default radius for ride search.",
  };
  return descriptions[key] ?? "";
}

/** Check if a config value is a boolean-type key. */
export function isBooleanConfig(key: string): boolean {
  const booleanKeys = [
    "maintenance_mode",
    "announcement_enabled",
    "beta_registration_open",
    "feedback_enabled",
  ];
  return booleanKeys.includes(key);
}

/** Check if a config value is a numeric key. */
export function isNumericConfig(key: string): boolean {
  const numericKeys = ["max_upload_size_mb", "chat_message_limit", "ride_search_radius_km"];
  return numericKeys.includes(key);
}
