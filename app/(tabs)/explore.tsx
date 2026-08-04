import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { Search, SlidersHorizontal, MapPin, RefreshCw } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { RideCard, RideCardSkeleton } from "@/components/app/RideCard";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/app/EmptyState";
import { Stagger } from "@/components/ui/animations";
import { searchRides, RideError } from "@/services/rides";
import type { Ride, RideSearchFilters } from "@/types/ride";

const PAGE_SIZE = 10;
const chips = ["All", "Today", "Women only", "Students", "Under ₦1,500", "Near me"];

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function dateForLabel(label: string): string | null {
  if (label === "Today") return toISODate(new Date());
  if (label === "Tomorrow") return toISODate(new Date(Date.now() + 24 * 3600 * 1000));
  if (label === "This week") {
    const d = new Date();
    d.setDate(d.getDate() + (7 - d.getDay()));
    return toISODate(d);
  }
  return null;
}

export default function Explore() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [rides, setRides] = useState<Ride[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [sheetPref, setSheetPref] = useState<string>("Any");
  const [sheetDest, setSheetDest] = useState("");
  const [maxFare, setMaxFare] = useState(5000);
  const [maxKm, setMaxKm] = useState(15);
  const requestedRef = useRef(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const sheetDateOptions = ["Today", "Tomorrow", "This week"];

  const baseFilters = useMemo((): RideSearchFilters => {
    if (active === "Today") return { date: toISODate(new Date()) };
    if (active === "Women only") return { womenOnly: true };
    if (active === "Students") return { studentOnly: true };
    if (active === "Near me") return { sort: "distance" };
    return { sort: "departure" };
  }, [active]);

  const filters = useMemo((): RideSearchFilters => {
    const f: RideSearchFilters = { ...baseFilters, sort: baseFilters.sort ?? "departure" };
    const dest = debouncedQuery.trim() || sheetDest.trim();
    if (dest) f.destination = dest;
    const date = sheetDate ?? (active === "Today" ? toISODate(new Date()) : null);
    if (date) f.date = date;
    if (sheetPref === "Women only") f.womenOnly = true;
    if (sheetPref === "Students only") f.studentOnly = true;
    return f;
  }, [baseFilters, debouncedQuery, sheetDest, sheetDate, sheetPref, active]);

  const clientFiltersActive =
    active === "Under ₦1,500" || maxFare < 5000 || maxKm < 15;

  const applyClientFilters = (list: Ride[]): Ride[] => {
    if (!clientFiltersActive) return list;
    return list.filter((r) => {
      if (active === "Under ₦1,500") {
        if (r.fareMode !== "fixed" || (r.fixedFare ?? 0) >= 1500) return false;
      }
      if (maxFare < 5000 && r.fareMode === "fixed" && (r.fixedFare ?? 0) > maxFare) return false;
      if (maxKm < 15 && r.distanceKm != null && r.distanceKm > maxKm) return false;
      return true;
    });
  };

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      const seq = ++requestedRef.current;
      try {
        setError(null);
        const { rides: rows, totalCount } = await searchRides({ ...filters, page: nextPage, pageSize: PAGE_SIZE });
        if (seq !== requestedRef.current) return;
        setRides((prev) => {
          const merged = replace ? rows : [...prev, ...rows];
          return applyClientFilters(merged);
        });
        setTotal(totalCount);
        setPage(nextPage);
      } catch (e) {
        if (seq !== requestedRef.current) return;
        setError(e instanceof RideError ? e.message : "Couldn't load rides — please try again.");
      } finally {
        if (seq === requestedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filters, clientFiltersActive, active, maxFare, maxKm],
  );

  useEffect(() => {
    setLoading(true);
    load(1, true);
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  const loadMore = () => {
    if (loading || clientFiltersActive) return;
    load(page + 1, false);
  };

  const applySheet = () => {
    setSheetOpen(false);
    setPage(1);
  };

  const showCount = useMemo(() => {
    if (clientFiltersActive) return rides.length;
    return total;
  }, [clientFiltersActive, rides.length, total]);

  return (
    <PhoneShell>
      <Screen>
        <TopBar
          title="Explore rides"
          subtitle={total > 0 ? `${total} ride${total === 1 ? "" : "s"} near you` : "Find a ride near you"}
          action={
            <IconButton accessibilityLabel="Filters" onPress={() => setSheetOpen(true)}>
              <SlidersHorizontal size={18} color={colors.secondaryForeground} />
            </IconButton>
          }
        />

        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
          data={rides}
          keyExtractor={(r) => r.id}
          renderItem={({ item: r, index: i }) => (
            <Stagger index={i}>
              <View style={{ paddingHorizontal: gutter }}>
                <RideCard ride={r} />
              </View>
            </Stagger>
          )}
          ListHeaderComponent={
            <>
              <View style={{ paddingHorizontal: gutter, paddingTop: 16 }}>
                <Input
                  icon={<Search size={16} color={colors.mutedForeground} />}
                  placeholder="Search destination or landmark"
                  value={query}
                  onChangeText={setQuery}
                  containerStyle={{ minHeight: 48 }}
                  style={{
                    height: 48,
                    borderRadius: radius.lg,
                    backgroundColor: colors.card,
                    paddingLeft: 40,
                    ...shadows.soft,
                  }}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 16, gap: 8 }}
              >
                {chips.map((f) => (
                  <Chip key={f} active={active === f} onPress={() => setActive(active === f ? "All" : f)}>
                    {f}
                  </Chip>
                ))}
              </ScrollView>

              {error ? (
                <View style={{ paddingHorizontal: gutter }}>
                  <EmptyState
                    icon={<RefreshCw size={28} color={colors.destructive} />}
                    title="Couldn't load rides"
                    body={error}
                    action={
                      <Button variant="outline" onPress={refresh}>
                        <AppText size="sm" weight={600} color={colors.primary}>
                          Try again
                        </AppText>
                      </Button>
                    }
                  />
                </View>
              ) : loading ? (
                <View style={{ paddingHorizontal: gutter, gap: 12 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <RideCardSkeleton key={i} />
                  ))}
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !loading && !error && rides.length === 0 ? (
              <EmptyState
                icon={<MapPin size={28} color={colors.primary} />}
                title="No rides match yet"
                body="Try widening your filters, or create a ride and let Covians come to you."
              />
            ) : null
          }
          ListFooterComponent={
            !clientFiltersActive && rides.length > 0 && rides.length < total ? (
              <View style={{ paddingHorizontal: gutter, marginTop: 4 }}>
                <Button variant="outline" onPress={loadMore} disabled={loading}>
                  <AppText size="sm" weight={600} color={colors.primary}>
                    {loading ? "Loading…" : `Load more (${total - rides.length} left)`}
                  </AppText>
                </Button>
              </View>
            ) : null
          }
        />
      </Screen>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 24 }}
      >
        <View style={{ gap: 8 }}>
          <Label>Destination</Label>
          <Input
            placeholder="e.g. Victoria Island"
            value={sheetDest}
            onChangeText={setSheetDest}
            containerStyle={{ minHeight: 48 }}
            style={{ height: 48, borderRadius: radius.lg }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Label>Date</Label>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {sheetDateOptions.map((d) => (
              <Chip key={d} active={sheetDate === dateForLabel(d)} onPress={() => setSheetDate(dateForLabel(d))}>
                {d}
              </Chip>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Label>Preference</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["Any", "Women only", "Students only"].map((d) => (
              <Chip key={d} active={sheetPref === d} onPress={() => setSheetPref(d)}>
                {d}
              </Chip>
            ))}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Label>Max fare per seat — {maxFare >= 5000 ? "No limit" : `₦${maxFare.toLocaleString()}`}</Label>
          <Slider value={maxFare} minimumValue={500} maximumValue={5000} step={100} onValueChange={setMaxFare} />
        </View>

        <View style={{ gap: 12 }}>
          <Label>Pickup within {maxKm >= 15 ? "any distance" : `${maxKm} km`}</Label>
          <Slider value={maxKm} minimumValue={1} maximumValue={15} step={1} onValueChange={setMaxKm} />
        </View>

        <Button block style={{ height: 52, borderRadius: radius.lg }} onPress={applySheet}>
          <AppText size="base" weight={600} color={colors.primaryForeground}>
            Show {showCount} rides
          </AppText>
        </Button>
      </BottomSheet>
    </PhoneShell>
  );
}
