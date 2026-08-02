import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Car, ChevronRight, Clock, Search, Users as UsersIcon } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { adminSearchRides } from "@/services/admin";
import type { AdminRideRow } from "@/types/admin";

const STATUS_FILTERS = ["All", "published", "in_progress", "completed", "cancelled", "expired"];

const PAGE_SIZE = 30;

const naira = (n: number) => `₦${n.toLocaleString()}`;

function RideRow({ ride }: { ride: AdminRideRow }) {
  const router = useRouter();
  const when = new Date(ride.departure_time);
  return (
    <Pressable
      onPress={() => router.push(`/admin/rides/${ride.id}`)}
      style={({ pressed }) => [
        {
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 14,
          ...shadows.soft,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <AppText size="xs" weight={700} color={colors.primary} style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {ride.ride_status.replace("_", " ")}
        </AppText>
        <AppText size="xs" color={colors.mutedForeground} numberOfLines={1} style={{ flexShrink: 1 }}>
          Hosted by {ride.host_name ?? "unknown"}
        </AppText>
      </View>
      <AppText size="base" family="display" weight={700} numberOfLines={1} style={{ marginTop: 6 }}>
        {ride.origin} → {ride.destination}
      </AppText>
      <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 16, rowGap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Clock size={13} color={colors.mutedForeground} />
          <AppText size="xs" color={colors.mutedForeground}>
            {when.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
            {when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <UsersIcon size={13} color={colors.mutedForeground} />
          <AppText size="xs" color={colors.mutedForeground}>
            {ride.total_seats - ride.available_seats}/{ride.total_seats} seats
          </AppText>
        </View>
        {ride.fare_mode === "fixed" && ride.fixed_fare != null ? (
          <AppText size="xs" weight={600}>{naira(Number(ride.fixed_fare))}</AppText>
        ) : (
          <AppText size="xs" color={colors.mutedForeground}>Flexible fare</AppText>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {ride.is_women_only ? (
            <View style={{ borderRadius: radius.full, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 2 }}>
              <AppText size="xs" weight={600} color={colors.primary}>Women</AppText>
            </View>
          ) : null}
          {ride.is_student_only ? (
            <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 2 }}>
              <AppText size="xs" weight={600} color={colors.secondaryForeground}>Students</AppText>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <AppText size="xs" color={colors.mutedForeground}>
          Created {new Date(ride.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
        </AppText>
        <ChevronRight size={14} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

export default function AdminRides() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [rides, setRides] = useState<AdminRideRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const pageResult = await adminSearchRides({
          query: debouncedQuery || null,
          status: status === "All" ? null : status,
          page: 1,
          pageSize: PAGE_SIZE,
        });
        setRides(pageResult.items);
        setTotal(pageResult.totalCount);
        setPage(1);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load rides.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedQuery, status],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || rides.length >= total) return;
    setLoadingMore(true);
    try {
      const next = await adminSearchRides({
        query: debouncedQuery || null,
        status: status === "All" ? null : status,
        page: page + 1,
        pageSize: PAGE_SIZE,
      });
      setRides((prev) => [...prev, ...next.items]);
      setPage((p) => p + 1);
    } catch (e) {
      setError((e as Error).message || "Couldn't load more rides.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, rides.length, total, debouncedQuery, status, page]);

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Rides" subtitle={`${total.toLocaleString()} rides`} />
        <View style={{ paddingHorizontal: gutter, gap: 10, paddingVertical: 12 }}>
          <Input
            icon={<Search size={16} color={colors.mutedForeground} />}
            placeholder="Search route, host or ride ID…"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {STATUS_FILTERS.map((s) => (
              <Chip key={s} active={status === s} onPress={() => setStatus(s)}>
                {s === "All" ? s : s.replace("_", " ")}
              </Chip>
            ))}
          </ScrollView>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {loading ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ paddingVertical: 24, textAlign: "center" }}>
              Loading rides…
            </AppText>
          ) : error && rides.length === 0 ? (
            <EmptyState
              icon={<Car size={26} color={colors.primary} />}
              title="Couldn't load rides"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : rides.length === 0 ? (
            <EmptyState
              icon={<Search size={26} color={colors.primary} />}
              title="No rides found"
              body="Try a different search term or filter."
            />
          ) : (
            <>
              {rides.map((r) => (
                <RideRow key={r.id} ride={r} />
              ))}
              {rides.length < total ? (
                <Button
                  variant="secondary"
                  disabled={loadingMore}
                  onPress={() => void loadMore()}
                  style={{ height: 44, borderRadius: radius.lg }}
                >
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                    {loadingMore ? "Loading…" : `Load more (${rides.length} of ${total})`}
                  </AppText>
                </Button>
              ) : null}
            </>
          )}
        </ScrollView>
        <AdminTabBar />
      </Screen>
    </PhoneShell>
  );
}
