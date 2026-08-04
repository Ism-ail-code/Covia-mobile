/**
 * Covia Notification Helpers — notification display and formatting utilities.
 */

/** Get a human-readable label for a notification type. */
export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ride_request: "Ride Request",
    ride_cancelled: "Ride Cancelled",
    ride_started: "Ride Started",
    ride_completed: "Ride Completed",
    ride_joined: "Rider Joined",
    ride_left: "Rider Left",
    message: "New Message",
    verification_approved: "Verification Approved",
    verification_rejected: "Verification Rejected",
    sos_alert: "SOS Alert",
    safety_check: "Safety Check",
    rating_received: "New Rating",
    system: "System",
    announcement: "Announcement",
  };
  return labels[type] ?? "Notification";
}

/** Get an emoji/icon key for a notification type. */
export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    ride_request: "car",
    ride_cancelled: "x-circle",
    ride_started: "play-circle",
    ride_completed: "check-circle",
    ride_joined: "users",
    ride_left: "user-minus",
    message: "message-circle",
    verification_approved: "badge-check",
    verification_rejected: "x-octagon",
    sos_alert: "alert-triangle",
    safety_check: "shield",
    rating_received: "star",
    system: "info",
    announcement: "megaphone",
  };
  return icons[type] ?? "bell";
}

/** Check if a notification type requires immediate attention. */
export function isUrgentNotification(type: string): boolean {
  return ["sos_alert", "safety_check", "ride_cancelled"].includes(type);
}

/** Format notification count for badge display. */
export function formatBadgeCount(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}
