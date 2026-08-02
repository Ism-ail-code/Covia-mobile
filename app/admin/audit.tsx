import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { History, Search, ShieldAlert } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { adminListAuditLog } from "@/services/admin";
import { can } from "@/types/admin";
import type { AuditRow } from "@/types/admin";

const PAGE_SIZE = 40;

export default function AdminAudit() {
  const { adminRole } = useAuth();
  const canView = can(adminRole, "audit.view");
  const [action, setAction] = useState("");
  const [debouncedAction, setDebouncedAction] = useState("");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedAction(action.trim()), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [action]);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await adminListAuditLog({ action: debouncedAction || null, page: 1, pageSize: PAGE_SIZE });
        setRows(result.items);
        setTotal(result.totalCount);
        setPage(1);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load the audit log.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedAction],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || rows.length >= total) return;
    setLoadingMore(true);
    try {
      const next = await adminListAuditLog({ action: debouncedAction || null, page: page + 1, pageSize: PAGE_SIZE });
      setRows((prev) => [...prev, ...next.items]);
      setPage((p) => p + 1);
    } catch (e) {
      setError((e as Error).message || "Couldn't load more entries.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, rows.length, total, debouncedAction, page]);

  const summarize = (obj: Record<string, unknown> | null): string | null => {
    if (!obj) return null;
    const entries = Object.entries(obj)
      .slice(0, 6)
      .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
    return entries.join(", ");
  };

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Audit log" subtitle={`${total.toLocaleString()} entries`} back />
        <View style={{ paddingHorizontal: gutter, paddingVertical: 12 }}>
          <Input
            icon={<Search size={16} color={colors.mutedForeground} />}
            placeholder="Filter by action (e.g. admin_ban_user)…"
            value={action}
            onChangeText={setAction}
            autoCapitalize="none"
          />
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
              body="Your role can't view the audit log."
            />
          ) : loading ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 24 }}>
              Loading audit log…
            </AppText>
          ) : error && rows.length === 0 ? (
            <EmptyState
              icon={<History size={26} color={colors.primary} />}
              title="Couldn't load the audit log"
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
              title="No entries"
              body="Nothing matches this filter yet."
            />
          ) : (
            <>
              {rows.map((r) => {
                const isOpen = expanded === r.id;
                const summary = summarize(r.new_values ?? r.details);
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
                      <AppText size="sm" weight={700} style={{ flex: 1 }} numberOfLines={1}>
                        {r.action}
                      </AppText>
                      <AppText size="xs" color={colors.mutedForeground}>
                        {new Date(r.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                      </AppText>
                    </View>
                    <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 4 }} numberOfLines={1}>
                      {r.actor_name ?? "system"} {r.actor_role ? `(${r.actor_role})` : ""}
                      {r.target_type ? ` → ${r.target_type}${r.target_id ? ` ${r.target_id.slice(0, 8)}…` : ""}` : ""}
                    </AppText>
                    {isOpen && summary ? (
                      <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 8, lineHeight: 17 }}>
                        {summary}
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
