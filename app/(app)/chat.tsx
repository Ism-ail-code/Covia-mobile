import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, Lock } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/app/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import {
  getChat,
  getChatForRide,
  getChatMessages,
  markMessagesRead,
  sendChatMessage,
  subscribeToChatMessages,
} from "@/services/chat";
import type { Chat, ChatMessage } from "@/types/chat";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });

function Bubble({ m, mine }: { m: ChatMessage; mine: boolean }) {
  if (!mine && m.senderId == null) {
    return (
      <View
        style={{
          alignSelf: "center",
          maxWidth: "80%",
          borderRadius: 999,
          backgroundColor: colors.primarySoft,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <AppText size="xs" weight={500} color={colors.primary} style={{ fontSize: 11, textAlign: "center" }}>
          {m.message}
        </AppText>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: mine ? "row-reverse" : "row", gap: 8 }}>
      <View style={{ width: 28 }} />
      <View style={{ maxWidth: "76%", alignItems: mine ? "flex-end" : "flex-start" }}>
        {!mine && m.senderName ? (
          <AppText
            size="xs"
            weight={600}
            color={colors.mutedForeground}
            style={{ marginBottom: 2, paddingHorizontal: 4, fontSize: 10 }}
          >
            {m.senderName}
          </AppText>
        ) : null}
        <View
          style={{
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: mine ? colors.primary : colors.card,
            borderBottomLeftRadius: mine ? 16 : 4,
            borderBottomRightRadius: mine ? 4 : 16,
            ...(mine ? {} : { borderWidth: 1, borderColor: colors.border }),
          }}
        >
          <AppText size="sm" color={mine ? colors.primaryForeground : colors.foreground}>
            {m.message}
          </AppText>
        </View>
        <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 4, paddingHorizontal: 4, fontSize: 10 }}>
          {formatTime(m.sentAt)}
          {mine && m.readCount > 0 ? " · read" : ""}
        </AppText>
      </View>
    </View>
  );
}

export default function Chat() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const loadedRide = useRef<string | null>(null);

  const resolveChatId = useCallback(
    async (rideId: string): Promise<string | null> => {
      const chatId = await getChatForRide(rideId);
      if (!chatId) return null;
      const loaded = await getChat(chatId);
      setChat(loaded);
      return chatId;
    },
    [],
  );

  useEffect(() => {
    if (!rideId || loadedRide.current === rideId) return;
    loadedRide.current = rideId;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const chatId = await resolveChatId(rideId);
        if (cancelled) return;
        if (!chatId) {
          setError("This chat isn't open yet — it starts once the host approves a passenger.");
          return;
        }
        const page = await getChatMessages(chatId, null, 40);
        if (cancelled) return;
        setMessages(page.items);
        setTotalCount(page.totalCount);
        void markMessagesRead(chatId).catch(() => {});
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Couldn't load the chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rideId, resolveChatId]);

  useEffect(() => {
    if (!chat) return;
    const off = subscribeToChatMessages(chat.id, (incoming) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
      void markMessagesRead(chat.id, incoming.id).catch(() => {});
    });
    return off;
  }, [chat]);

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || !chat || sending) return;
    setSending(true);
    try {
      const sent = await sendChatMessage(chat.id, body);
      setMessages((prev) => [...prev, sent]);
      setText("");
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (e) {
      toast.error((e as Error).message || "Couldn't send that message.");
    } finally {
      setSending(false);
    }
  }, [text, chat, sending, toast]);

  const loadEarlier = useCallback(async () => {
    if (!chat || messages.length === 0) return;
    try {
      const page = await getChatMessages(chat.id, messages[0].sentAt, 40);
      setMessages((prev) => [...page.items.filter((m) => !prev.some((p) => p.id === m.id)), ...prev]);
      setTotalCount(page.totalCount);
    } catch {
      toast.error("Couldn't load earlier messages.");
    }
  }, [chat, messages, toast]);

  const locked = chat ? chat.lockedAt != null && new Date(chat.lockedAt).getTime() < Date.now() : false;

  if (loading) {
    return (
      <PhoneShell>
        <TopBar title="Chat" back onBack={() => router.back()} />
        <Screen>
          <View style={{ padding: 40, alignItems: "center", gap: 8 }}>
            <AppText size="sm" color={colors.mutedForeground}>
              Opening chat…
            </AppText>
          </View>
        </Screen>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <TopBar
        title={chat ? `${chat.origin} → ${chat.destination}` : "Chat"}
        subtitle={
          chat
            ? `${chat.participantCount} Covians · departs ${formatTime(chat.departureTime)}`
            : undefined
        }
        back
        onBack={() => router.back()}
      />
      <Screen>
        {error || !chat ? (
          <EmptyState
            icon={<Lock size={28} color={colors.mutedForeground} />}
            title="Chat unavailable"
            body={error ?? "This ride has no chat yet."}
          />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, backgroundColor: `${colors.surface}99` }}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length < totalCount ? (
              <Pressable onPress={loadEarlier} style={{ alignSelf: "center", padding: 8 }}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  Load earlier messages
                </AppText>
              </Pressable>
            ) : null}
            {messages.map((m) => (
              <Bubble key={m.id} m={m} mine={m.senderId === user?.id} />
            ))}
            {messages.length === 0 ? (
              <View style={{ alignItems: "center", padding: 24, gap: 6 }}>
                <AppText size="sm" weight={600}>
                  Say hello
                </AppText>
                <AppText size="xs" color={colors.mutedForeground} style={{ textAlign: "center" }}>
                  This is the ride's group chat — coordinate pickup, timing and the fare split here.
                </AppText>
              </View>
            ) : null}
          </ScrollView>
        )}
      </Screen>

      {chat && !locked ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message Covians…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 96,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.background,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.foreground,
            }}
          />
          <IconButton
            accessibilityLabel="Send"
            onPress={send}
            disabled={!text.trim() || sending}
            style={{ height: 44, width: 44, borderRadius: 16, backgroundColor: text.trim() ? colors.primary : colors.muted }}
          >
            <Send size={18} color={colors.primaryForeground} />
          </IconButton>
        </View>
      ) : chat && locked ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
            paddingHorizontal: 20,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Lock size={16} color={colors.mutedForeground} />
          <AppText size="xs" color={colors.mutedForeground}>
            This chat is locked — the ride ended a while ago.
          </AppText>
        </View>
      ) : null}
    </PhoneShell>
  );
}
