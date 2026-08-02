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
import { safetyTips } from "@/data/mock";
import { useAuth } from "@/context/AuthContext";
import { getRideHistory, searchRides } from "@/services/rides";
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

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [feed, setFeed] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<RideHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const name = profile?.displayName?.split(" ")[0] ?? "Covian";
  const initials = (profile?.displayName ?? "Covia user")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [search, history] = await Promise.all([
          searchRides({ sort: "departure", pageSize: 6 }),
          getRideHistory(null, null, 1, 20).catch(() => null),
        ]);
        if (cancelled) return;
        setFeed(search.rides);
        setActiveRide(history?.entries.find((e) => e.rideStatus === "in_progress") ?? null);
      } catch {
        // Feed sections degrade silently; the explore screen surfaces errors.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nearby = useMemo(() => feed.slice(0, 3), [feed]);
  const recommended = useMemo(() => feed.slice(3, 6), [feed]);

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
                  Good morning
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
              </Pressable>
            </View>

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
                {profile?.homeCity ?? "Lagos, Nigeria"}
              </AppText>
            </View>

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
          <SectionHeader title="Recent activity" />
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
            {[
              { t: "Ride completed to Ikoyi", s: "Fare split ₦2,100 · 3 Covians", w: "Yesterday" },
              { t: "You rated Sara Mensah", s: "5 stars · “Very punctual”", w: "Yesterday" },
              { t: "Verification approved", s: "Government ID confirmed", w: "2 days ago" },
            ].map((a, i) => (
              <Pressable
                key={a.t}
                onPress={() => router.push("/activity")}
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
                    {a.t}
                  </AppText>
                  <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>
                    {a.s}
                  </AppText>
                </View>
                <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                  {a.w}
                </AppText>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
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
