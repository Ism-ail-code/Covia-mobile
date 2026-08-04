import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Check, X, UserPlus, CalendarX, Clock, Play, Flag, ShieldAlert, CheckCheck, RefreshCw } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { EmptyState } from "@/components/app/EmptyState";
import { Stagger } from "@/components/ui/animations";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotificationChanges,
  subscribeToNotifications,
} from "@/services/notifications";
import type { AppNotification, NotificationType } from "@/types/notifications";

const icons: Record<string, typeof UserPlus> = {
  ride_request_received: UserPlus,
  ride_request_approved: Check,
  ride_request_rejected: X,
  passenger_joined: UserPlus,
  passenger_left: X,
  passenger_removed: X,
  ride_updated: Clock,
  ride_cancelled: CalendarX,
  ride_started: Play,
  ride_completed: Flag,
  ride_expired: CalendarX,
  chat_message: Bell,
  chat_image: Bell,
  verification_approved: Check,
  verification_rejected: X,
  verification_submitted: Clock,
  resubmission_requested: Clock,
  welcome: Bell,
  password_changed: Bell,
  email_verified: Check,
  safety_check: ShieldAlert,
  emergency_alert: ShieldAlert,
  warning_issued: ShieldAlert,
  account_restricted: X,
  appeal_decided: Bell,
  report_resolved: Check,
  marketing: Bell,
};

const dangerKinds = new Set<NotificationType>([
  "ride_request_rejected",
  "ride_cancelled",
  "ride_expired",
  "passenger_left",
  "passenger_removed",
  "emergency_alert",
  "warning_issued",
  "account_restricted",
]);

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const NotificationItem = React.memo(function NotificationItem({
  n,
  onPress,
  onDelete,
}: {
  n: AppNotification;
  onPress: () => void;
  onDelete: () => void;
}) {
  const Icon = icons[n.type] ?? Bell;
  const danger = dangerKinds.has(n.type);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          gap: 12,
          borderRadius: 16,
          borderWidth: 1,
          padding: 16,
          borderColor: !n.isRead ? `${colors.primary}33` : colors.border,
          backgroundColor: !n.isRead ? `${colors.primarySoft}80` : colors.card,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={{
          height: 36,
          width: 36,
          borderRadius: radius.xl,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: danger ? colors.destructiveSoft : colors.primarySoft,
        }}
      >
        <Icon size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <AppText size="sm" weight={600} numberOfLines={1} style={{ flex: 1 }}>
            {n.title}
          </AppText>
          <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
            {timeAgo(n.createdAt)}
          </AppText>
        </View>
        <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 2 }} numberOfLines={2}>
          {n.message}
        </AppText>
      </View>
      <Pressable
        accessibilityLabel="Delete notification"
        onPress={onDelete}
        hitSlop={8}
        style={{ alignSelf: "center" }}
      >
        <X size={14} color={colors.mutedForeground} />
      </Pressable>
    </Pressable>
  );
});

export default function Notifications() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    const page = await getNotifications(1, 50);
    setItems(page.items);
    setTotalCount(page.totalCount);
    setUnread(page.items.filter((n) => !n.isRead).length);
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        await load();
        setLoadError(null);
      } catch (e) {
        setLoadError((e as Error).message || "Couldn't load notifications.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load, toast]);

  useEffect(() => {
    const offNew = subscribeToNotifications((n) => {
      setItems((prev) => [n, ...prev].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i));
      setTotalCount((c) => c + 1);
      setUnread((u) => u + 1);
    });
    const offChange = subscribeToNotificationChanges(() => {
      getUnreadCount()
        .then(setUnread)
        .catch(() => {});
    });
    return () => {
      offNew();
      offChange();
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Couldn't refresh notifications.");
    } finally {
      setRefreshing(false);
    }
  }, [load, toast]);

  const open = useCallback(async (n: AppNotification) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true, readAt: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      void markNotificationRead(n.id).catch(() => {});
    }
    const rideId = (n.data?.ride_id as string | undefined) ?? (n.data?.rideId as string | undefined);
    if (rideId) router.push(`/ride/${rideId}`);
  }, [router]);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));
    try {
      await deleteNotification(id);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't delete that notification.");
    }
  }, [toast]);

  const markAll = useCallback(async () => {
    const previousUnread = unread;
    const previousItems = items;
    setUnread(0);
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true, readAt: x.readAt ?? new Date().toISOString() })));
    try {
      await markAllNotificationsRead();
    } catch (e) {
      // Rollback on failure
      setUnread(previousUnread);
      setItems(previousItems);
      toast.error((e as Error).message || "Couldn't mark notifications as read.");
    }
  }, [toast, unread, items]);

  return (
    <PhoneShell>
      <TopBar
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
        back
        onBack={() => router.back()}
        action={
          unread > 0 ? (
            <Pressable onPress={markAll} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <CheckCheck size={16} color={colors.primary} />
              <AppText size="xs" weight={600} color={colors.primary}>
                Mark all
              </AppText>
            </Pressable>
          ) : undefined
        }
      />
      <Screen>
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          renderItem={({ item: n, index: i }) => (
            <Stagger index={i}>
              <NotificationItem
                n={n}
                onPress={() => open(n)}
                onDelete={() => remove(n.id)}
              />
            </Stagger>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 10, flexGrow: 1 }}
          ListHeaderComponent={
            loading ? (
              <View style={{ padding: 40, alignItems: "center", gap: 8 }}>
                <AppText size="sm" color={colors.mutedForeground}>
                  Loading notifications…
                </AppText>
              </View>
            ) : loadError ? (
              <EmptyState
                icon={<RefreshCw size={28} color={colors.destructive} />}
                title="Couldn't load notifications"
                body={loadError}
                action={
                  <Button variant="outline" onPress={() => {
                    setLoadError(null);
                    setLoading(true);
                    loadedRef.current = false;
                    load().then(() => setLoadError(null)).catch((e) => setLoadError((e as Error).message)).finally(() => setLoading(false));
                  }}>
                    <AppText size="sm" weight={600} color={colors.primary}>Try again</AppText>
                  </Button>
                }
              />
            ) : null
          }
          ListEmptyComponent={
            !loading && !loadError ? (
              <EmptyState
                icon={<Bell size={28} color={colors.primary} />}
                title="Nothing new"
                body="Ride updates and safety alerts will appear here."
              />
            ) : null
          }
          ListFooterComponent={
            !loading && items.length > 0 && items.length < totalCount ? (
              <AppText size="xs" color={colors.mutedForeground} style={{ textAlign: "center", paddingTop: 8 }}>
                {items.length} of {totalCount} — pull to load the rest
              </AppText>
            ) : null
          }
        />
      </Screen>
    </PhoneShell>
  );
}
