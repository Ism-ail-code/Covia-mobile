import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Activity, Search, ShieldAlert } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { adminListMonitoringEvents } from "@/services/admin";
import { can } from "@/types/admin";
import type { MonitoringEventRow } from "@/types/admin";

const LEVEL_FILTERS = ["All", "error", "warning", "info"];
const PAGE_SIZE = 40;

export default function AdminMonitoring() {
  const { adminRole } = useAuth();
  const canView = can(adminRole, "monitor.view");
  const [level, setLevel] = useState("All");
  const [rows, setRows] = useState<MonitoringEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await adminListMonitoringEvents({
          level: level === "All" ? null : level,
          page: 1,
          pageSize: PAGE_SIZE,
        });
        setRows(result.items);
        setTotal(result.totalCount);
        setPage(1);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load monitoring events.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [level],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || rows.length >= total) return;
    setLoadingMore(true);
    try {
      const next = await adminListMonitoringEvents({ level: level === "All" ? null : level, page: page + 1, pageSize: PAGE_SIZE });
      setRows((prev) => [...prev, ...next.items]);
      setPage((p) => p + 1);
    } catch (e) {
      setError((e as Error).message || "Couldn't load more events.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, rows.length, total, level, page]);

  const tone = (l: string) =>
    l === "error"
      ? { bg: colors.destructiveSoft, fg: colors.destructive }
      : l === "warning"
        ? { bg: colors.warningSoft, fg: colors.warningForeground }
        : { bg: colors.primarySoft, fg: colors.primary };

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Monitoring" subtitle={`${total.toLocaleString()} events`} back />
        <View style={{ paddingHorizontal: gutter, paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LEVEL_FILTERS.map((l) => (
              <Chip key={l} active={level === l} onPress={() => setLevel(l)}>
                {l}
              </Chip>
            ))}
          </ScrollView>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {!canView ? (
            <EmptyState
              icon={<ShieldAlert size={26} color={colors.mutedForeground} />}
              title="Restricted"
              body="Your role can't view monitoring events."
            />
          ) : loading ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 24 }}>
              Loading events…
            </AppText>
          ) : error && rows.length === 0 ? (
            <EmptyState
              icon={<Activity size={26} color={colors.primary} />}
              title="Couldn't load events"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Search size={26} color={colors.primary} />}
              title="No events"
              body="Nothing matches this filter yet."
            />
          ) : (
            <>
              {rows.map((r) => {
                const t = tone(r.level);
                const isOpen = expanded === r.id;
                const details = typeof r.details === "object" && r.details ? JSON.stringify(r.details) : null;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setExpanded(isOpen ? null : r.id)}
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ borderRadius: radius.full, backgroundColor: t.bg, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <AppText size="xs" weight={700} color={t.fg}>{r.level}</AppText>
                      </View>
                      <AppText size="xs" weight={600} color={colors.mutedForeground}>{r.source}</AppText>
                      <AppText size="xs" color={colors.mutedForeground} style={{ marginLeft: "auto" }}>
                        {new Date(r.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                      </AppText>
                    </View>
                    <AppText size="sm" weight={600} style={{ marginTop: 8 }}>{r.message}</AppText>
                    {isOpen && details ? (
                      <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 8, lineHeight: 17 }} numberOfLines={6}>
                        {details}
                      </AppText>
                    ) : null}
                  </Pressable>
                );
              })}
              {rows.length < total ? (
                <Button
                  variant="secondary"
                  disabled={loadingMore}
                  onPress={() => void loadMore()}
                  style={{ height: 44, borderRadius: radius.lg }}
                >
                  {loadingMore ? "Loading…" : `Load more (${rows.length} of ${total})`}
                </Button>
              ) : null}
            </>
          )}
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
