/**
 * Covia Chat Helpers — chat display and formatting utilities.
 */

/** Truncate a message preview for notification/list display. */
export function truncateMessage(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength - 1) + "\u2026";
}

/** Format a chat timestamp for display. */
export function formatChatTime(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Get a label for the chat type. */
export function getChatTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ride: "Ride Chat",
    support: "Support",
    system: "System",
  };
  return labels[type] ?? "Chat";
}

/** Check if a message is from the current user. */
export function isOwnMessage(messageUserId: string, currentUserId: string): boolean {
  return messageUserId === currentUserId;
}

/** Format read receipt status. */
export function formatReadStatus(isRead: boolean): string {
  return isRead ? "Read" : "Delivered";
}

/** Generate a chat room ID from two user IDs (consistent ordering). */
export function getChatRoomId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}
