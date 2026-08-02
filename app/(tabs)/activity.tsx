import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarX2, Clock, Users } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { Stagger } from "@/components/ui/animations";
import { getRideHistory } from "@/services/rides";
import { RIDE_STATUS_LABELS, type RideHistoryEntry, type RideStatus } from "@/types/ride";

const tabs: Array<{ value: string; label: string }> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const GROUP: Record<string, RideStatus[]> = {
  upcoming: ["published", "full", "draft"],
  active: ["in_progress"],
  completed: ["completed"],
  cancelled: ["cancelled", "expired"],
};

const naira = (n: number) => `₦${n.toLocaleString()}`;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, now)) return `Today · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function HistoryCard({ entry }: { entry: RideHistoryEntry }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/ride/${entry.rideId}`)}
      style={({ pressed }) => [
        {
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 16,
          ...shadows.soft,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <AppText size="xs" weight={600} color={colors.primary} style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {entry.relation}
        </AppText>
        <AppText size="xs" weight={600} color={colors.mutedForeground}>
          {RIDE_STATUS_LABELS[entry.rideStatus]}
        </AppText>
      </View>
      <AppText size="base" family="display" weight={700} numberOfLines={1} style={{ marginTop: 8 }}>
        {entry.origin} → {entry.destination}
      </AppText>
      <View
        style={{
          marginTop: 8,
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 16,
          rowGap: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Clock size={13} color={colors.mutedForeground} />
          <AppText size="xs" color={colors.mutedForeground}>
            {formatWhen(entry.departureTime)}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Users size={13} color={colors.mutedForeground} />
          <AppText size="xs" color={colors.mutedForeground}>
            {entry.availableSeats} of {entry.totalSeats} seats
          </AppText>
        </View>
        {entry.fareMode === "fixed" && entry.fixedFare != null ? (
          <AppText size="xs" weight={600}>
            {naira(entry.fixedFare)}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Activity() {
  const router = useRouter();
  const [tab, setTab] = useState("upcoming");
  const [entries, setEntries] = useState<RideHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshingNow = false) => {
    if (refreshingNow) setRefreshing(true);
    else setLoading(true);
    try {
      const { entries: rows } = await getRideHistory(null, null, 1, 50);
      setEntries(rows);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Couldn't load your rides.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = GROUP[tab];
  const list = entries.filter((e) => grouped.includes(e.rideStatus));

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Activity" subtitle="Your rides, hosted and joined" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          <Tabs
            columns={4}
            value={tab}
            onChange={setTab}
            tabs={tabs}
          />

          <View style={{ marginTop: 16, gap: 12 }}>
            {loading ? (
              <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 40 }}>
                Loading your rides…
              </AppText>
            ) : error ? (
              <EmptyState
                icon={<CalendarX2 size={28} color={colors.destructive} />}
                title="Couldn't load rides"
                body={error}
                action={
                  <Button variant="outline" onPress={() => load()}>
                    <AppText size="sm" weight={600} color={colors.primary}>
                      Try again
                    </AppText>
                  </Button>
                }
              />
            ) : list.length ? (
              list.map((e, i) => (
                <Stagger key={`${e.rideId}-${e.relation}`} index={i}>
                  <HistoryCard entry={e} />
                </Stagger>
              ))
            ) : (
              <EmptyState
                icon={<CalendarX2 size={28} color={colors.primary} />}
                title={`No ${tab} rides`}
                body="When you host or join a ride it will show up right here."
                action={
                  <Button block style={{ height: 48, borderRadius: 16, paddingHorizontal: 24 }} onPress={() => router.push("/explore")}>
                    <AppText size="sm" weight={600} color={colors.primaryForeground}>
                      Browse rides
                    </AppText>
                  </Button>
                }
              />
            )}
          </View>
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
