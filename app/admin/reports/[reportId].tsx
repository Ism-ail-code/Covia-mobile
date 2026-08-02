import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, ChevronRight, Flag, ShieldAlert } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { ActionDialog } from "@/components/admin/ActionDialog";
import { useAuth } from "@/context/AuthContext";
import { adminListReports, adminReviewReport } from "@/services/admin";
import { can } from "@/types/admin";
import type { ReportRow } from "@/types/admin";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 8 }}>
      <AppText size="xs" color={colors.mutedForeground} weight={600}>{label}</AppText>
      <AppText size="sm" weight={600} numberOfLines={1} style={{ flexShrink: 1, textAlign: "right" }}>{value}</AppText>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
          paddingHorizontal: 16,
          paddingVertical: 8,
          ...shadows.soft,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function AdminReportDetail() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const router = useRouter();
  const { adminRole } = useAuth();
  const canReview = can(adminRole, "report.review");
  const [report, setReport] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"confirm" | "dismiss" | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (!reportId) return;
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const page = await adminListReports({ status: null, page: 1, pageSize: 100 });
        const match = page.items.find((r) => r.id === reportId);
        if (!match) throw new Error("Report not found.");
        setReport(match);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load this report.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [reportId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (note: string) => {
      if (!report || !action) return;
      setActionBusy(true);
      setActionError(null);
      try {
        await adminReviewReport(report.id, action === "confirm", note || null);
        setLastAction(action === "confirm" ? "Report confirmed." : "Report dismissed.");
        setAction(null);
        await load();
      } catch (e) {
        setActionError((e as Error).message || "Couldn't review the report.");
      } finally {
        setActionBusy(false);
      }
    },
    [report, action, load],
  );

  const open = report && !["resolved", "dismissed"].includes(report.status);

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Report" subtitle={reportId ? `…${reportId.slice(0, 8)}` : undefined} back />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {loading && !report ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 32 }}>
              Loading report…
            </AppText>
          ) : error && !report ? (
            <EmptyState
              icon={<Flag size={26} color={colors.destructive} />}
              title="Couldn't load this report"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : report ? (
            <>
              <View
                style={[
                  {
                    borderRadius: radius["2xl"],
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    padding: 16,
                    ...shadows.soft,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ height: 40, width: 40, borderRadius: radius.lg, backgroundColor: colors.destructiveSoft, alignItems: "center", justifyContent: "center" }}>
                    <Flag size={18} color={colors.destructive} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText size="base" family="display" weight={700}>{report.reason}</AppText>
                    <AppText size="xs" color={colors.mutedForeground}>
                      {report.status.replace(/_/g, " ")}
                      {report.is_confirmed ? " · confirmed" : ""} · {new Date(report.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </AppText>
                  </View>
                </View>
                {report.details ? (
                  <AppText size="sm" color={colors.foreground} style={{ marginTop: 12, lineHeight: 20 }}>
                    {report.details}
                  </AppText>
                ) : null}
              </View>

              <Section title="Parties">
                <Pressable
                  onPress={() => report.reporter_user_id && router.push(`/admin/users/${report.reporter_user_id}`)}
                  style={({ pressed }) => [
                    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Avatar size={40} src={null} name={report.reporter_name ?? "Reporter"} fallback={(report.reporter_name ?? "R").slice(0, 2).toUpperCase()} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText size="sm" weight={600} numberOfLines={1}>{report.reporter_name ?? "Reporter"}</AppText>
                    <AppText size="xs" color={colors.mutedForeground}>Reporter</AppText>
                  </View>
                  <ChevronRight size={14} color={colors.mutedForeground} />
                </Pressable>
                {report.target_type === "user" && report.target_user_id ? (
                  <Pressable
                    onPress={() => router.push(`/admin/users/${report.target_user_id}`)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Avatar size={40} src={null} name={report.target_user_name ?? "Target"} fallback={(report.target_user_name ?? "T").slice(0, 2).toUpperCase()} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText size="sm" weight={600} numberOfLines={1}>{report.target_user_name ?? "Target user"}</AppText>
                      <AppText size="xs" color={colors.mutedForeground}>Reported user</AppText>
                    </View>
                    <ChevronRight size={14} color={colors.mutedForeground} />
                  </Pressable>
                ) : report.target_type === "ride" && report.target_ride_id ? (
                  <Pressable
                    onPress={() => router.push(`/admin/rides/${report.target_ride_id}`)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <AppText size="sm" weight={600} style={{ flex: 1 }} numberOfLines={1}>
                      Ride {report.target_ride_id.slice(0, 8)}…
                    </AppText>
                    <ChevronRight size={14} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </Section>

              <Section title="Details">
                <InfoRow label="Target type" value={report.target_type.replace(/_/g, " ")} />
                <InfoRow label="Status" value={report.status.replace(/_/g, " ")} />
                <InfoRow label="Confirmed" value={report.is_confirmed ? "Yes" : "No"} />
                {report.resolution_note ? <InfoRow label="Resolution note" value={report.resolution_note} /> : null}
                <InfoRow label="Submitted" value={new Date(report.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} />
              </Section>

              {lastAction ? (
                <StatusBanner tone="success" icon={<CheckCircle2 size={16} color={colors.success} />} title={lastAction} />
              ) : null}

              {canReview ? (
                <View
                  style={[
                    {
                      borderRadius: radius["2xl"],
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      padding: 16,
                      gap: 10,
                      ...shadows.soft,
                    },
                  ]}
                >
                  <AppText size="sm" weight={700}>Review decision</AppText>
                  {open ? (
                    <View style={{ gap: 8 }}>
                      <Button variant="default" onPress={() => setAction("confirm")} style={{ height: 44, borderRadius: radius.lg }}>
                        Confirm report
                      </Button>
                      <Button variant="outline" onPress={() => setAction("dismiss")} style={{ height: 44, borderRadius: radius.lg }}>
                        Dismiss report
                      </Button>
                    </View>
                  ) : (
                    <AppText size="xs" color={colors.mutedForeground}>
                      This report was already reviewed.
                    </AppText>
                  )}
                </View>
              ) : (
                <View
                  style={[
                    {
                      borderRadius: radius["2xl"],
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      padding: 16,
                      alignItems: "center",
                      gap: 8,
                      ...shadows.soft,
                    },
                  ]}
                >
                  <ShieldAlert size={20} color={colors.mutedForeground} />
                  <AppText size="xs" color={colors.mutedForeground} style={{ textAlign: "center" }}>
                    Your role can view reports but not review them.
                  </AppText>
                </View>
              )}

              <ActionDialog
                visible={action !== null}
                title={action === "confirm" ? "Confirm report" : "Dismiss report"}
                body={
                  action === "confirm"
                    ? "Confirming flags the report as legitimate and feeds the target's case history."
                    : "Dismissing marks the report as not actionable."
                }
                confirmLabel={action === "confirm" ? "Confirm" : "Dismiss"}
                tone={action === "confirm" ? "default" : "secondary"}
                requireReason={false}
                reasonPlaceholder="Optional note for the audit log…"
                busy={actionBusy}
                error={actionError}
                onClose={() => {
                  setAction(null);
                  setActionError(null);
                }}
                onConfirm={(note) => void submit(note)}
              />
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
