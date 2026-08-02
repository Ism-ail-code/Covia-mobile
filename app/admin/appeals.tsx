import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Gavel, Search } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { adminListAppeals } from "@/services/admin";
import type { AppealRow } from "@/types/admin";

const STATUS_FILTERS = ["All", "pending", "under_review", "approved", "rejected"];
const PAGE_SIZE = 30;

function AppealRowItem({ appeal }: { appeal: AppealRow }) {
  const router = useRouter();
  const tone =
    appeal.status === "approved"
      ? { bg: colors.successSoft, fg: colors.success }
      : appeal.status === "rejected"
        ? { bg: colors.destructiveSoft, fg: colors.destructive }
        : { bg: colors.warningSoft, fg: colors.warningForeground };
  return (
    <Pressable
      onPress={() => router.push(`/admin/appeals/${appeal.id}`)}
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
        <Gavel size={14} color={colors.primary} />
        <AppText size="sm" weight={700} style={{ flex: 1 }} numberOfLines={1}>
          {appeal.action_type.replace(/_/g, " ")} appeal
        </AppText>
        <View style={{ borderRadius: radius.full, backgroundColor: tone.bg, paddingHorizontal: 8, paddingVertical: 2 }}>
          <AppText size="xs" weight={700} color={tone.fg}>{appeal.status.replace(/_/g, " ")}</AppText>
        </View>
      </View>
      <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 6 }} numberOfLines={2}>
        {appeal.user_name ?? "A member"} — {appeal.appeal_reason}
      </AppText>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <AppText size="xs" color={colors.mutedForeground}>
          {new Date(appeal.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </AppText>
        <ChevronRight size={14} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

export default function AdminAppeals() {
  const [status, setStatus] = useState("All");
  const [rows, setRows] = useState<AppealRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await adminListAppeals({
          status: status === "All" ? null : status,
          page: 1,
          pageSize: PAGE_SIZE,
        });
        setRows(result.items);
        setTotal(result.totalCount);
        setPage(1);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load appeals.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || rows.length >= total) return;
    setLoadingMore(true);
    try {
      const next = await adminListAppeals({ status: status === "All" ? null : status, page: page + 1, pageSize: PAGE_SIZE });
      setRows((prev) => [...prev, ...next.items]);
      setPage((p) => p + 1);
    } catch (e) {
      setError((e as Error).message || "Couldn't load more appeals.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, rows.length, total, status, page]);

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Appeals" subtitle={`${total.toLocaleString()} appeals`} />
        <View style={{ paddingHorizontal: gutter, paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {STATUS_FILTERS.map((s) => (
              <Chip key={s} active={status === s} onPress={() => setStatus(s)}>
                {s === "All" ? s : s.replace(/_/g, " ")}
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
              Loading appeals…
            </AppText>
          ) : error && rows.length === 0 ? (
            <EmptyState
              icon={<Gavel size={26} color={colors.primary} />}
              title="Couldn't load appeals"
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
              title="No appeals"
              body="There are no appeals matching this filter."
            />
          ) : (
            <>
              {rows.map((a) => (
                <AppealRowItem key={a.id} appeal={a} />
              ))}
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
        <AdminTabBar />
      </Screen>
    </PhoneShell>
  );
}
