/**
 * Chat models.
 *
 * Mirrors the Phase 7 Supabase schema (0019 + 0020): one `ride_chats`
 * row per ride (auto-created at publish), a `chat_messages` feed with
 * soft deletes and edit history, and per-message `message_reads`
 * receipts. The feed is read through `get_chat_messages` with cursor
 * pagination (`p_before` = the oldest `sentAt` already loaded) and a
 * stable `total_count`; writes go through security-definer RPCs.
 */

export type ChatMessageType = "text" | "image";

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string | null;
  messageType: ChatMessageType;
  message: string | null;
  mediaUrl: string | null;
  sentAt: string;
  editedAt: string | null;
  readCount: number;
};

export type ChatMessagePage = {
  items: ChatMessage[];
  totalCount: number;
};

export type Chat = {
  id: string;
  rideId: string;
  createdAt: string;
  archivedAt: string | null;
  lockedAt: string | null;
  rideStatus: string;
  origin: string;
  pickupPoint: string;
  destination: string;
  departureTime: string;
  hostId: string;
  hostName: string;
  participantCount: number;
};
