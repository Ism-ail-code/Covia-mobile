import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Search,
  MapPin,
  Plus,
  Compass,
  ShieldCheck,
  Clock,
  ChevronRight,
  Lightbulb,
  type LucideIcon,
} from "lucide-react-native";
import { colors, gradientBrandEnd, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, SectionHeader } from "@/components/app/PhoneShell";
import { RideCard, RideCardSkeleton } from "@/components/app/RideCard";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { PulseDot } from "@/components/ui/animations";
import { safetyTips } from "@/data/safetyTips";
import { useAuth } from "@/context/AuthContext";
import { getRideHistory, searchRides } from "@/services/rides";
import {
  getUnreadCount,
  subscribeToNotifications,
  subscribeToNotificationChanges,
} from "@/services/notifications";
import type { Ride, RideHistoryEntry } from "@/types/ride";

const quick: Array<{ label: string; icon: LucideIcon; to: "/create" | "/explore" | "/safety" | "/activity" }> = [
  { label: "Create ride", icon: Plus, to: "/create" },
  { label: "Browse", icon: Compass, to: "/explore" },
  { label: "Safety", icon: ShieldCheck, to: "/safety" },
  { label: "Activity", icon: Clock, to: "/activity" },
];

const naira = (n: number) => `₦${n.toLocaleString()}`;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const activityTitle = (e: RideHistoryEntry) =>
  `${e.rideStatus === "completed" ? "Ride completed" : e.rideStatus === "cancelled" || e.rideStatus === "expired" ? "Ride ended" : "Ride scheduled"} to ${e.destination}`;

const activitySubtitle = (e: RideHistoryEntry) =>
  `${e.relation === "hosted" ? "You hosted" : e.relation === "joined" ? "You joined" : "Requested"} · ${e.rideStatus === "published" ? "departs" : e.rideStatus} ${formatTime(e.departureTime)}`;

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [feed, setFeed] = useState<Ride[]>([]);
  const [nearby, setNearby] = useState<Ride[]>([]);
  const [history, setHistory] = useState<RideHistoryEntry[]>([]);
  const [activeRide, setActiveRide] = useState<RideHistoryEntry | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const name = profile?.displayName?.split(" ")[0] ?? "Covian";
  const initials = (profile?.displayName ?? "Covia user")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [search, nearbySearch, historyResult] = await Promise.all([
          searchRides({ sort: "departure", pageSize: 3 }),
          profile?.homeCity
            ? searchRides({ origin: profile.homeCity, sort: "departure", pageSize: 3 }).catch(
                () => null,
              )
            : Promise.resolve(null),
          getRideHistory(null, null, 1, 20).catch(() => null),
        ]);
        if (cancelled) return;
        setFeed(search.rides);
        setNearby(nearbySearch?.rides?.length ? nearbySearch.rides : search.rides);
        setHistory(historyResult?.entries ?? []);
        setActiveRide(historyResult?.entries.find((e) => e.rideStatus === "in_progress") ?? null);
      } catch {
        // Feed sections degrade silently; the explore screen surfaces errors.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.homeCity]);

  useEffect(() => {
    let mounted = true;
    getUnreadCount()
      .then((n) => {
        if (mounted) setUnread(n);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const offNew = subscribeToNotifications(() => setUnread((n) => n + 1));
    const offRead = subscribeToNotificationChanges(() => {
      getUnreadCount()
        .then((n) => setUnread(n))
        .catch(() => {});
    });
    return () => {
      offNew();
      offRead();
    };
  }, []);

  const recommended = useMemo(() => feed, [feed]);

  return (
    <PhoneShell>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" }}>
          <LinearGradient
            colors={[colors.primary, gradientBrandEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: insets.top + 28, paddingBottom: 32, paddingHorizontal: gutter }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable onPress={() => router.push("/profile")}>
                <Avatar
                  src={profile?.avatarUrl ?? undefined}
                  fallback={initials}
                  size={44}
                  ring={{ color: `${colors.primaryForeground}66` }}
                  alt={profile?.displayName ?? "Profile"}
                />
              </Pressable>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText size="xs" color={`${colors.primaryForeground}CC`}>
                  {greeting}
                </AppText>
                <AppText
                  size="lg"
                  family="display"
                  weight={700}
                  color={colors.primaryForeground}
                  numberOfLines={1}
                >
                  {name}
                </AppText>
              </View>
              <Pressable
                accessibilityLabel="Notifications"
                onPress={() => router.push("/notifications")}
                style={({ pressed }) => [
                  {
                    height: 40,
                    width: 40,
                    borderRadius: radius.full,
                    backgroundColor: `${colors.primaryForeground}26`,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Bell size={20} color={colors.primaryForeground} />
                {unread > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: colors.destructive,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }}
                  >
                    <AppText
                      size="xs"
                      weight={700}
                      color={colors.destructiveForeground}
                      style={{ fontSize: 10, lineHeight: 14 }}
                    >
                      {unread > 99 ? "99+" : unread}
                    </AppText>
                  </View>
                ) : null}
              </Pressable>
            </View>

            {profile?.homeCity ? (
              <View
                style={{
                  marginTop: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MapPin size={14} color={`${colors.primaryForeground}D9`} />
                <AppText size="xs" color={`${colors.primaryForeground}D9`}>
                  {profile.homeCity}
                </AppText>
              </View>
            ) : null}

            <Pressable
              onPress={() => router.push("/explore")}
              style={({ pressed }) => [
                {
                  marginTop: 16,
                  height: 52,
                  borderRadius: radius.lg,
                  backgroundColor: colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  ...shadows.lifted,
                  opacity: pressed ? 0.95 : 1,
                },
              ]}
            >
              <Search size={18} color={colors.mutedForeground} />
              <AppText size="sm" color={colors.mutedForeground}>
                Where are you heading?
              </AppText>
            </Pressable>
          </LinearGradient>
        </View>

        <View
          style={{
            marginTop: -20,
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: gutter,
          }}
        >
          {quick.map(({ label, icon: Icon, to }) => (
            <Pressable
              key={label}
              onPress={() => router.push(to)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  alignItems: "center",
                  gap: 6,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  paddingVertical: 12,
                  ...shadows.soft,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Icon size={20} color={colors.primary} />
              <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ fontSize: 10 }}>
                {label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {activeRide ? (
          <View style={{ marginTop: 28 }}>
            <SectionHeader
              title="Active ride"
              action={
                <Pressable onPress={() => router.push(`/ride/${activeRide.rideId}`)}>
                  <AppText size="xs" weight={600} color={colors.primary}>
                    Open ride
                  </AppText>
                </Pressable>
              }
            />
            <View style={{ paddingHorizontal: gutter }}>
              <Pressable
                onPress={() => router.push(`/ride/${activeRide.rideId}`)}
                style={({ pressed }) => [
                  {
                    borderRadius: radius["2xl"],
                    borderWidth: 1,
                    borderColor: `${colors.success}40`,
                    backgroundColor: colors.successSoft,
                    padding: 16,
                    ...shadows.soft,
                    opacity: pressed ? 0.95 : 1,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <PulseDot size={8} color={colors.success} ringDistance={12} />
                  <AppText size="xs" weight={600} color={colors.success}>
                    In progress · departing {formatTime(activeRide.departureTime)}
                  </AppText>
                </View>
                <AppText size="base" family="display" weight={700} style={{ marginTop: 8 }}>
                  {activeRide.destination}
                </AppText>
                <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 2 }}>
                  {activeRide.hostDisplayName ?? "Covia host"} hosting ·{" "}
                  {activeRide.totalSeats - activeRide.availableSeats + 1} Covians ·{" "}
                  {activeRide.fareMode === "fixed" && activeRide.fixedFare != null
                    ? `${naira(activeRide.fixedFare)} each`
                    : "smart fare"}
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Nearby rides"
            action={
              <Pressable onPress={() => router.push("/explore")}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  See all
                </AppText>
              </Pressable>
            }
          />
          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: gutter, gap: 12 }}
            >
              {Array.from({ length: 2 }).map((_, i) => (
                <View key={i} style={{ width: 300 }}>
                  <RideCardSkeleton />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: gutter, gap: 12, paddingBottom: 8 }}
            >
              {nearby.map((r) => (
                <View key={r.id} style={{ width: 300 }}>
                  <RideCard ride={r} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {!loading && recommended.length > 0 ? (
          <View style={{ marginTop: 28 }}>
            <SectionHeader title="Recommended for you" />
            <View style={{ paddingHorizontal: gutter, gap: 12 }}>
              {recommended.map((r) => (
                <RideCard key={r.id} ride={r} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Recent activity"
            action={
              <Pressable onPress={() => router.push("/activity")}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  See all
                </AppText>
              </Pressable>
            }
          />
          <View
            style={{
              marginHorizontal: gutter,
              borderRadius: radius["2xl"],
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              overflow: "hidden",
            }}
          >
            {history.slice(0, 3).map((entry, i) => (
              <Pressable
                key={entry.rideId}
                onPress={() => router.push(`/ride/${entry.rideId}`)}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 16,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText size="sm" weight={500} numberOfLines={1}>
                    {activityTitle(entry)}
                  </AppText>
                  <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>
                    {activitySubtitle(entry)}
                  </AppText>
                </View>
                <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                  {timeAgo(entry.createdAt)}
                </AppText>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
            {!loading && history.length === 0 ? (
              <AppText size="xs" color={colors.mutedForeground} style={{ padding: 16, textAlign: "center" }}>
                No rides yet — create or join one to see it here.
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Safety tips"
            action={
              <Pressable onPress={() => router.push("/safety")}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  Safety centre
                </AppText>
              </Pressable>
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: gutter, gap: 12, paddingBottom: 8 }}
          >
            {safetyTips.map((tip) => (
              <View
                key={tip}
                style={{
                  width: 240,
                  borderRadius: radius["2xl"],
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  padding: 16,
                  ...shadows.soft,
                }}
              >
                <Lightbulb size={20} color={colors.warning} />
                <AppText
                  size="xs"
                  color={colors.mutedForeground}
                  style={{ marginTop: 8, lineHeight: 18 }}
                >
                  {tip}
                </AppText>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginTop: 28, paddingHorizontal: gutter, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip>Verified community</Chip>
            <Chip>No drivers, no vehicles</Chip>
            <Chip>Fares split fairly</Chip>
          </View>
        </View>
      </ScrollView>
    </PhoneShell>
  );
}
