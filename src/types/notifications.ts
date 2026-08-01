/**
 * Notification models.
 *
 * Mirrors the Phase 6 + 7 Supabase schema (0017–0019): a normalized
 * per-user feed (`notifications`), opt-in switches
 * (`notification_preferences`) and device push-token registration
 * (`push_tokens`). The feed is read through `get_notifications`
 * (cursor-agnostic offset pages with a stable `total_count`).
 */

export type NotificationType =
  | "ride_request_received"
  | "ride_request_approved"
  | "ride_request_rejected"
  | "passenger_joined"
  | "passenger_left"
  | "passenger_removed"
  | "ride_updated"
  | "ride_cancelled"
  | "ride_started"
  | "ride_completed"
  | "ride_expired"
  | "chat_message"
  | "chat_image"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected"
  | "resubmission_requested"
  | "welcome"
  | "password_changed"
  | "email_verified"
  | "safety_check"
  | "emergency_alert"
  | "marketing";

export type AppNotification = {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

/** One page of the feed: rows plus the full-history total. */
export type NotificationPage = {
  items: AppNotification[];
  totalCount: number;
};

export type NotificationPreferences = {
  userId: string;
  rideEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  verificationEnabled: boolean;
  safetyEnabled: boolean;
  marketingEnabled: boolean;
  chatEnabled: boolean;
  updatedAt: string | null;
};

export type NotificationPreferencesChanges = Partial<
  Omit<NotificationPreferences, "userId" | "updatedAt">
>;
