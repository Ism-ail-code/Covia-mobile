/**
 * Chat service — ride chat rooms, message feed, sending, receipts and
 * search.
 *
 * Talks to the Phase 7 Supabase backend (migrations 0019 + 0020). A
 * chat exists for every ride (created automatically on publish); it
 * archives when the ride completes and locks two hours after
 * completion / cancellation / expiry. All writes are security-definer
 * RPCs; new messages arrive over `postgres_changes` on
 * `chat_messages` (RLS-scoped to chat participants).
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Chat,
  ChatMessage,
  ChatMessagePage,
  ChatMessageType,
} from "../types/chat";

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatError";
  }
}

function toChatError(error: unknown): ChatError {
  const message = (error as { message?: string })?.message ?? "";
  const code = (error as { code?: string })?.code ?? "";
  if (code === "28000") return new ChatError("Please sign in again.");
  if (code === "42501" || message.includes("You are not on this ride")) {
    return new ChatError("Only ride members can use this chat.");
  }
  if (message.includes("This chat has been archived")) {
    return new ChatError("This chat closed when the ride ended.");
  }
  if (message.includes("locked")) {
    return new ChatError("This chat is locked. The ride ended a while ago.");
  }
  if (message.includes("2000 characters")) {
    return new ChatError("Messages are limited to 2000 characters.");
  }
  if (message.includes("text or image")) {
    return new ChatError("Only text and image messages are supported.");
  }
  if (message.includes("No image")) {
    return new ChatError("Attach an image you uploaded to this chat first.");
  }
  if (message.includes("Message not found")) {
    return new ChatError("That message no longer exists.");
  }
  return new ChatError(message || "Something went wrong with the chat.");
}

function requireConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new ChatError("Chat isn't available yet — add your Supabase keys to .env.");
  }
}

type ChatRow = {
  id: string;
  ride_id: string;
  created_at: string;
  archived_at: string | null;
  locked_at: string | null;
  ride_status: string;
  origin: string;
  pickup_point: string;
  destination: string;
  departure_time: string;
  host_id: string;
  host_name: string | null;
  participant_count: string | number;
};

function mapChat(row: ChatRow): Chat {
  return {
    id: row.id,
    rideId: row.ride_id,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    lockedAt: row.locked_at,
    rideStatus: row.ride_status,
    origin: row.origin,
    pickupPoint: row.pickup_point,
    destination: row.destination,
    departureTime: row.departure_time,
    hostId: row.host_id,
    hostName: row.host_name ?? "Host",
    participantCount: Number(row.participant_count),
  };
}

type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string | null;
  message_type: ChatMessageType;
  message: string | null;
  media_url: string | null;
  sent_at: string;
  edited_at: string | null;
  read_count: string | number;
  total_count: string | number;
};

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    messageType: row.message_type,
    message: row.message,
    mediaUrl: row.media_url,
    sentAt: row.sent_at,
    editedAt: row.edited_at,
    readCount: Number(row.read_count),
  };
}

/** Load a ride chat (must be a participant). */
export async function getChat(chatId: string): Promise<Chat> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_chat", { p_chat_id: chatId });
  if (error) throw toChatError(error);
  return mapChat(data as ChatRow);
}

/**
 * Resolve the chat id for a ride. Returns null when the ride has no chat
 * yet (created on the first approved passenger) or the user isn't a
 * participant. RLS on `ride_chats` scopes the lookup.
 */
export async function getChatForRide(rideId: string): Promise<string | null> {
  requireConfigured();
  const { data, error } = await supabase
    .from("ride_chats")
    .select("id")
    .eq("ride_id", rideId)
    .maybeSingle();
  if (error) throw toChatError(error);
  return data?.id ?? null;
}

/**
 * Load a page of messages (newest first). Pass the oldest `sentAt` you
 * already have as `before` to page further back; `null` loads the
 * newest page.
 */
export async function getChatMessages(
  chatId: string,
  before?: string | null,
  pageSize = 30,
): Promise<ChatMessagePage> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_chat_messages", {
    p_chat_id: chatId,
    p_before: before ?? null,
    p_page_size: pageSize,
  });
  if (error) throw toChatError(error);
  const rows = (data ?? []) as MessageRow[];
  return {
    items: rows.map(mapMessage),
    totalCount: Number(rows[0]?.total_count ?? 0),
  };
}

/** Send a text message (max 2000 characters). */
export async function sendChatMessage(chatId: string, message: string): Promise<ChatMessage> {
  requireConfigured();
  const { data, error } = await supabase.rpc("send_chat_message", {
    p_chat_id: chatId,
    p_message: message,
    p_message_type: "text",
  });
  if (error) throw toChatError(error);
  return mapMessage(data as MessageRow);
}

/** Send an image message whose media was already uploaded to the chat. */
export async function sendChatImage(chatId: string, mediaUrl: string): Promise<ChatMessage> {
  requireConfigured();
  const { data, error } = await supabase.rpc("send_chat_message", {
    p_chat_id: chatId,
    p_message: null,
    p_message_type: "image",
    p_media_url: mediaUrl,
  });
  if (error) throw toChatError(error);
  return mapMessage(data as MessageRow);
}

export async function editChatMessage(messageId: string, message: string): Promise<ChatMessage> {
  requireConfigured();
  const { data, error } = await supabase.rpc("edit_chat_message", {
    p_message_id: messageId,
    p_message: message,
  });
  if (error) throw toChatError(error);
  return mapMessage(data as MessageRow);
}

export async function deleteChatMessage(messageId: string): Promise<void> {
  requireConfigured();
  const { error } = await supabase.rpc("delete_chat_message", { p_message_id: messageId });
  if (error) throw toChatError(error);
}

/** Mark everything up to (and including) `through` as read. */
export async function markMessagesRead(chatId: string, through?: string): Promise<number> {
  requireConfigured();
  const { data, error } = await supabase.rpc("mark_messages_read", {
    p_chat_id: chatId,
    p_through: through ?? null,
  });
  if (error) throw toChatError(error);
  return Number(data ?? 0);
}

export async function searchChatMessages(
  chatId: string,
  query: string,
  pageSize = 20,
): Promise<ChatMessagePage> {
  requireConfigured();
  const { data, error } = await supabase.rpc("search_chat_messages", {
    p_chat_id: chatId,
    p_query: query,
    p_page_size: pageSize,
  });
  if (error) throw toChatError(error);
  const rows = (data ?? []) as MessageRow[];
  return {
    items: rows.map(mapMessage),
    totalCount: Number(rows[0]?.total_count ?? 0),
  };
}

/** Subscribe to new messages in a chat (RLS-scoped to participants). */
export function subscribeToChatMessages(
  chatId: string,
  onMessage: (message: ChatMessage) => void,
): () => void {
  requireConfigured();
  const channel = supabase
    .channel(`chat-messages-${chatId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_id=eq.${chatId}` },
      (payload) => {
        onMessage(mapMessage(payload.new as MessageRow));
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
