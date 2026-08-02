import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { BarChart3, ShieldAlert } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { adminGetAnalytics } from "@/services/admin";
import { can } from "@/types/admin";
import type { AnalyticsJson } from "@/types/admin";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <AppText size="xs" weight={700} color={colors.mutedForeground} style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </AppText>
      <View
        style={{
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 16,
          gap: 8,
          ...shadows.soft,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 3 }}>
      <AppText size="xs" color={colors.mutedForeground}>{label}</AppText>
      <AppText size="sm" weight={700}>{value}</AppText>
    </View>
  );
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export default function AdminAnalytics() {
  const { adminRole } = useAuth();
  const canView = can(adminRole, "analytics.view");
  const [analytics, setAnalytics] = useState<AnalyticsJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshingNow = false) => {
    if (refreshingNow) setRefreshing(true);
    else setLoading(true);
    try {
      const a = await adminGetAnalytics();
      setAnalytics(a);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Couldn't load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Analytics" subtitle="Platform deep-dive" back />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {!canView ? (
            <EmptyState
              icon={<ShieldAlert size={26} color={colors.mutedForeground} />}
              title="Restricted"
              body="Your role can't view platform analytics."
            />
          ) : loading && !analytics ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 24 }}>
              Loading analytics…
            </AppText>
          ) : error && !analytics ? (
            <EmptyState
              icon={<BarChart3 size={26} color={colors.primary} />}
              title="Couldn't load analytics"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : analytics ? (
            <>
              <Card title="Users">
                <StatRow label="Total accounts" value={fmt(analytics.users.overview.total_users)} />
                <StatRow label="Verified" value={fmt(analytics.users.overview.verified_users)} />
                <StatRow label="Government ID verified" value={fmt(analytics.users.overview.government_id_verified)} />
                <StatRow label="Student verified" value={fmt(analytics.users.overview.student_verified)} />
                <StatRow label="New (7d)" value={fmt(analytics.users.overview.new_users_7d)} />
                <StatRow label="Active (7d)" value={fmt(analytics.users.overview.active_users_7d)} />
                <StatRow label="Active (30d)" value={fmt(analytics.users.overview.active_users_30d)} />
                <StatRow label="Suspended" value={fmt(analytics.users.overview.suspended_users)} />
                <StatRow label="Banned" value={fmt(analytics.users.overview.banned_users)} />
              </Card>

              {analytics.users.weekly_retention.length > 0 ? (
                <Card title="Weekly retention">
                  {analytics.users.weekly_retention.map((r) => (
                    <StatRow
                      key={r.cohort}
                      label={`${r.cohort} cohort (${fmt(r.signups)} signups)`}
                      value={r.retention != null ? `${(r.retention * 100).toFixed(0)}%` : "—"}
                    />
                  ))}
                </Card>
              ) : null}

              <Card title="Rides">
                <StatRow label="Total" value={fmt(analytics.rides.overview.total_rides)} />
                <StatRow label="Published" value={fmt(analytics.rides.overview.published_rides)} />
                <StatRow label="In progress" value={fmt(analytics.rides.overview.in_progress_rides)} />
                <StatRow label="Completed" value={fmt(analytics.rides.overview.completed_rides)} />
                <StatRow label="Cancelled" value={fmt(analytics.rides.overview.cancelled_rides)} />
                <StatRow label="Expired" value={fmt(analytics.rides.overview.expired_rides)} />
                <StatRow label="This week" value={fmt(analytics.rides.overview.rides_7d)} />
                <StatRow
                  label="Average occupancy"
                  value={analytics.rides.overview.average_occupancy != null ? analytics.rides.overview.average_occupancy.toFixed(2) : "—"}
                />
              </Card>

              {analytics.rides.popular_routes.length > 0 ? (
                <Card title="Popular routes">
                  {analytics.rides.popular_routes.map((r) => (
                    <StatRow key={`${r.origin}-${r.destination}`} label={`${r.origin} → ${r.destination}`} value={fmt(r.rides)} />
                  ))}
                </Card>
              ) : null}

              <Card title="Safety">
                <StatRow label="Safety events" value={fmt(analytics.safety.safety_events)} />
                <StatRow label="Reports submitted" value={fmt(analytics.safety.reports_submitted)} />
                <StatRow label="Reports pending" value={fmt(analytics.safety.reports_pending)} />
                <StatRow label="Reports resolved" value={fmt(analytics.safety.reports_resolved)} />
              </Card>

              <Card title="Platform">
                <StatRow label="Notifications sent" value={fmt(analytics.platform.notifications_sent)} />
                <StatRow label="Unread notifications" value={fmt(analytics.platform.notifications_unread)} />
                <StatRow label="Push tokens" value={fmt(analytics.platform.push_tokens)} />
                <StatRow label="Pending outbound messages" value={fmt(analytics.platform.pending_outbound)} />
                <StatRow label="Database size" value={`${analytics.platform.database.database_size_mb.toFixed(1)} MB`} />
                <StatRow label="Active connections" value={fmt(analytics.platform.database.active_connections)} />
                <StatRow
                  label="Cache hit ratio"
                  value={analytics.platform.database.cache_hit_ratio != null ? `${(analytics.platform.database.cache_hit_ratio * 100).toFixed(1)}%` : "—"}
                />
                <StatRow
                  label="Transaction commit rate"
                  value={analytics.platform.database.transaction_commit_rate != null ? `${(analytics.platform.database.transaction_commit_rate * 100).toFixed(1)}%` : "—"}
                />
              </Card>

              {analytics.platform.storage.length > 0 ? (
                <Card title="Storage by bucket">
                  {analytics.platform.storage.map((s) => (
                    <StatRow key={s.bucket} label={`${s.bucket} (${fmt(s.objects)} objects)`} value={fmtBytes(s.bytes)} />
                  ))}
                </Card>
              ) : null}

              {analytics.platform.rpc_latency && analytics.platform.rpc_latency.length > 0 ? (
                <Card title="RPC latency">
                  {analytics.platform.rpc_latency.map((r) => (
                    <StatRow key={r.name} label={`${r.name} (${fmt(r.calls)} calls)`} value={`${r.avg_ms.toFixed(1)} ms`} />
                  ))}
                </Card>
              ) : null}

              {analytics.platform.largest_tables && analytics.platform.largest_tables.length > 0 ? (
                <Card title="Largest tables">
                  {analytics.platform.largest_tables.map((t) => (
                    <StatRow key={t.table} label={`${t.table} (${fmt(t.rows)} rows)`} value={`${t.size_mb.toFixed(1)} MB`} />
                  ))}
                </Card>
              ) : null}

              {error ? (
                <AppText size="xs" color={colors.destructive} style={{ textAlign: "center" }}>{error}</AppText>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
