/**
 * Notification service — feed, unread badge, preferences and push-token
 * registration.
 *
 * Talks to the Phase 6 + 7 Supabase backend (migrations 0017–0019).
 * Reads go through `get_notifications` / `get_unread_notification_count`;
 * every state change goes through an RPC. New rows arrive in real time
 * over `postgres_changes` on `notifications` (RLS filters the feed to
 * the signed-in user).
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  AppNotification,
  NotificationPage,
  NotificationPreferences,
  NotificationPreferencesChanges,
  NotificationType,
} from "../types/notifications";

export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationError";
  }
}

function toNotificationError(error: unknown): NotificationError {
  const message = (error as { message?: string })?.message ?? "";
  const code = (error as { code?: string })?.code ?? "";
  if (code === "28000") return new NotificationError("Please sign in again.");
  if (message.includes("Unknown notification type")) {
    return new NotificationError("That notification filter is not supported.");
  }
  return new NotificationError(message || "Something went wrong with notifications.");
}

function requireConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new NotificationError("Notifications aren't available yet — add your Supabase keys to .env.");
  }
}

type NotificationRow = {
  id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
  total_count: string | number;
};

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    actorUserId: row.actor_user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: row.data,
    isRead: row.is_read,
    readAt: row.read_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

type PreferencesRow = {
  user_id: string;
  ride_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  verification_enabled: boolean;
  safety_enabled: boolean;
  marketing_enabled: boolean;
  chat_enabled: boolean;
  updated_at: string | null;
};

function mapPreferences(row: PreferencesRow): NotificationPreferences {
  return {
    userId: row.user_id,
    rideEnabled: row.ride_enabled,
    pushEnabled: row.push_enabled,
    emailEnabled: row.email_enabled,
    verificationEnabled: row.verification_enabled,
    safetyEnabled: row.safety_enabled,
    marketingEnabled: row.marketing_enabled,
    chatEnabled: row.chat_enabled,
    updatedAt: row.updated_at,
  };
}

/** Fetch one page of the feed (newest first). */
export async function getNotifications(
  page = 1,
  pageSize = 20,
  unreadOnly = false,
  type: NotificationType | null = null,
): Promise<NotificationPage> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_notifications", {
    p_page: page,
    p_page_size: pageSize,
    p_unread_only: unreadOnly,
    p_type: type,
  });
  if (error) throw toNotificationError(error);
  const rows = (data ?? []) as NotificationRow[];
  return {
    items: rows.map(mapNotification),
    totalCount: Number(rows[0]?.total_count ?? 0),
  };
}

export async function getUnreadCount(): Promise<number> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_unread_notification_count");
  if (error) throw toNotificationError(error);
  return Number(data ?? 0);
}

export async function markNotificationRead(notificationId: string): Promise<AppNotification> {
  requireConfigured();
  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });
  if (error) throw toNotificationError(error);
  return mapNotification(data as NotificationRow);
}

export async function markAllNotificationsRead(): Promise<number> {
  requireConfigured();
  const { data, error } = await supabase.rpc("mark_all_notifications_read");
  if (error) throw toNotificationError(error);
  return Number(data ?? 0);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  requireConfigured();
  const { error } = await supabase.rpc("delete_notification", {
    p_notification_id: notificationId,
  });
  if (error) throw toNotificationError(error);
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_notification_preferences");
  if (error) throw toNotificationError(error);
  return mapPreferences(data as PreferencesRow);
}

export async function updateNotificationPreferences(
  changes: NotificationPreferencesChanges,
): Promise<NotificationPreferences> {
  requireConfigured();
  const { data, error } = await supabase.rpc("update_notification_preferences", {
    p_ride_enabled: changes.rideEnabled ?? null,
    p_push_enabled: changes.pushEnabled ?? null,
    p_email_enabled: changes.emailEnabled ?? null,
    p_verification_enabled: changes.verificationEnabled ?? null,
    p_safety_enabled: changes.safetyEnabled ?? null,
    p_marketing_enabled: changes.marketingEnabled ?? null,
    p_chat_enabled: changes.chatEnabled ?? null,
  });
  if (error) throw toNotificationError(error);
  return mapPreferences(data as PreferencesRow);
}

/** Register the device push token (delivery itself is a later phase). */
export async function registerPushToken(
  token: string,
  platform: "android" | "ios" | null = null,
  deviceId?: string,
): Promise<void> {
  requireConfigured();
  const { error } = await supabase.rpc("register_push_token", {
    p_token: token,
    p_device_id: deviceId ?? null,
    p_platform: platform,
  });
  if (error) throw toNotificationError(error);
}

export async function removePushToken(token: string): Promise<void> {
  requireConfigured();
  const { error } = await supabase.rpc("remove_push_token", { p_token: token });
  if (error) throw toNotificationError(error);
}

/** Subscribe to new notifications for the signed-in user (RLS-scoped). */
export function subscribeToNotifications(
  onNotification: (notification: AppNotification) => void,
): () => void {
  requireConfigured();
  const channel = supabase
    .channel("notifications-feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        onNotification(mapNotification(payload.new as NotificationRow));
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
