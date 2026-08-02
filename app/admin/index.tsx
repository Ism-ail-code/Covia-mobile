import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { useAuth } from "@/context/AuthContext";
import { adminGetAnalytics, getPlatformHealth } from "@/services/admin";
import type { AnalyticsJson, PlatformHealth } from "@/types/admin";

function StatTile({ icon: Icon, label, value, tone = "brand" }: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "brand" | "success" | "warning" | "danger";
}) {
  const tones = {
    brand: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warningForeground },
    danger: { bg: colors.destructiveSoft, fg: colors.destructive },
  }[tone];
  return (
    <View
      style={[
        {
          flex: 1,
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 14,
          minWidth: 140,
          ...shadows.soft,
        },
      ]}
    >
      <View style={{ height: 32, width: 32, borderRadius: radius.lg, backgroundColor: tones.bg, alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} color={tones.fg} />
      </View>
      <AppText size="xl" family="display" weight={800} style={{ marginTop: 10 }}>
        {value}
      </AppText>
      <AppText size="xs" color={colors.mutedForeground} weight={600}>
        {label}
      </AppText>
    </View>
  );
}

const quickLinks: Array<{ to: string; label: string; icon: LucideIcon; caption: string }> = [
  { to: "/admin/users", label: "Users", icon: Users, caption: "Search accounts & cases" },
  { to: "/admin/rides", label: "Rides", icon: Car, caption: "Find any ride" },
  { to: "/admin/verification", label: "Review queue", icon: ShieldCheck, caption: "ID & student submissions" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { adminRole } = useAuth();
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshingNow = false) => {
    if (refreshingNow) setRefreshing(true);
    else setLoading(true);
    try {
      const [h, a] = await Promise.all([getPlatformHealth(), adminGetAnalytics()]);
      setHealth(h);
      setAnalytics(a);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Couldn't load admin dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const degraded = health && health.status !== "ok";
  const failedChecks = health?.checks.filter((c) => !c.ok) ?? [];

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Admin console" subtitle={adminRole ? `Signed in as ${adminRole.replace("_", " ")}` : undefined} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {loading && !health ? (
            <View style={{ padding: gutter }}>
              <AppText size="sm" color={colors.mutedForeground}>Loading dashboard…</AppText>
            </View>
          ) : error && !health ? (
            <View style={{ padding: gutter }}>
              <StatusBanner tone="danger" title="Couldn't load the dashboard" body={error} />
            </View>
          ) : (
            <View style={{ gap: 16, paddingHorizontal: gutter, paddingTop: 16 }}>
              {health ? (
                <StatusBanner
                  tone={degraded ? "danger" : "success"}
                  icon={degraded ? <AlertTriangle size={16} color={colors.destructive} /> : <CheckCircle2 size={16} color={colors.success} />}
                  title={degraded ? "Platform degraded" : "All systems operational"}
                  body={
                    failedChecks.length > 0
                      ? `${failedChecks.map((c) => c.name).join(", ")} ${failedChecks.length > 1 ? "need" : "needs"} attention · DB ${health.database_size_mb.toFixed(1)} MB`
                      : `Database ${health.database_size_mb.toFixed(1)} MB · checked ${new Date(health.checked_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
                  }
                />
              ) : null}

              {analytics ? (
                <>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                    <StatTile icon={Users} label="Total users" value={analytics.users.overview.total_users.toLocaleString()} />
                    <StatTile icon={Activity} label="Active users (30d)" value={analytics.users.overview.active_users_30d.toLocaleString()} />
                    <StatTile icon={Car} label="Rides this week" value={analytics.rides.overview.rides_7d.toLocaleString()} tone="success" />
                    <StatTile
                      icon={ShieldCheck}
                      label="Reports pending"
                      value={analytics.safety.reports_pending.toLocaleString()}
                      tone={analytics.safety.reports_pending > 0 ? "warning" : "success"}
                    />
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                    <StatTile
                      icon={Car}
                      label="In progress"
                      value={analytics.rides.overview.in_progress_rides.toLocaleString()}
                    />
                    <StatTile
                      icon={AlertTriangle}
                      label="Suspended users"
                      value={analytics.users.overview.suspended_users.toLocaleString()}
                      tone={analytics.users.overview.suspended_users > 0 ? "warning" : "brand"}
                    />
                    <StatTile
                      icon={AlertTriangle}
                      label="Safety events"
                      value={analytics.safety.safety_events.toLocaleString()}
                      tone={analytics.safety.safety_events > 0 ? "danger" : "brand"}
                    />
                    <StatTile
                      icon={Activity}
                      label="Avg occupancy"
                      value={
                        analytics.rides.overview.average_occupancy == null
                          ? "—"
                          : `${analytics.rides.overview.average_occupancy.toFixed(1)}/ride`
                      }
                    />
                  </View>
                </>
              ) : null}

              <View style={{ gap: 10 }}>
                {quickLinks.map(({ to, label, icon: Icon, caption }) => (
                  <Pressable
                    key={to}
                    onPress={() => router.push(to as never)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 14,
                        borderRadius: radius["2xl"],
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        padding: 16,
                        ...shadows.soft,
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}
                  >
                    <View style={{ height: 40, width: 40, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                      <Icon size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText size="sm" weight={700}>{label}</AppText>
                      <AppText size="xs" color={colors.mutedForeground}>{caption}</AppText>
                    </View>
                    <ArrowRight size={16} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>

              {error ? <StatusBanner tone="warning" title="Some data failed to refresh" body={error} /> : null}
            </View>
          )}
        </ScrollView>
        <AdminTabBar />
      </Screen>
    </PhoneShell>
  );
}
