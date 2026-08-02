import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CheckCircle2, ExternalLink, FileText, GraduationCap, IdCard, ShieldAlert, UserX } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, StatusBanner } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { ActionDialog } from "@/components/admin/ActionDialog";
import { useAuth } from "@/context/AuthContext";
import { adminListVerifications, adminReviewVerification } from "@/services/admin";
import { getPrivateSignedUrl } from "@/services/storage";
import { VERIFICATION_DOCUMENTS_BUCKET } from "@/types/verification";
import { can } from "@/types/admin";
import type { VerificationQueueRow } from "@/types/admin";

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

type DocItem = { label: string; path: string | null };

type ReviewAction = "approve" | "reject" | "request_resubmission" | null;

export default function AdminSubmissionDetail() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const { adminRole } = useAuth();
  const canReview = can(adminRole, "verification.review");
  const [row, setRow] = useState<VerificationQueueRow | null>(null);
  const [docs, setDocs] = useState<Array<{ label: string; url: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ReviewAction>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (!submissionId) return;
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const all = await adminListVerifications({ status: "all", search: null, verificationType: null });
        const match = all.find((r) => r.id === submissionId);
        if (!match) throw new Error("Submission not found.");
        setRow(match);

        const items: DocItem[] =
          match.verification_type === "government_id"
            ? [
                { label: "ID front", path: match.front_document_url },
                { label: "ID back", path: match.back_document_url },
                { label: "Selfie", path: match.selfie_url },
              ]
            : [{ label: "Student card", path: match.student_card_url }];

        const signed = await Promise.all(
          items.map(async (d) => ({
            label: d.label,
            url: await getPrivateSignedUrl(VERIFICATION_DOCUMENTS_BUCKET, d.path),
          })),
        );
        setDocs(signed);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load this submission.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [submissionId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const submitReview = useCallback(
    async (reason: string) => {
      if (!row || !action) return;
      setActionBusy(true);
      setActionError(null);
      try {
        await adminReviewVerification(row.id, action, reason || null);
        setLastAction(action === "approve" ? "Submission approved." : action === "reject" ? "Submission rejected." : "Resubmission requested.");
        setAction(null);
        await load();
      } catch (e) {
        setActionError((e as Error).message || "Couldn't review the submission.");
      } finally {
        setActionBusy(false);
      }
    },
    [row, action, load],
  );

  const actionConfig =
    action === "approve"
      ? { title: "Approve submission", body: "This will mark the member's identity as verified.", confirm: "Approve", tone: "default" as const, requireReason: false }
      : action === "reject"
        ? { title: "Reject submission", body: "The member will see the reason and their documents stay attached.", confirm: "Reject", tone: "destructive" as const, requireReason: true }
        : action === "request_resubmission"
          ? { title: "Request resubmission", body: "Ask the member to upload new documents. Rejection reason shown.", confirm: "Request resubmission", tone: "secondary" as const, requireReason: true }
          : null;

  const statusTone =
    row?.status === "approved"
      ? { bg: colors.successSoft, fg: colors.success }
      : row?.status === "rejected"
        ? { bg: colors.destructiveSoft, fg: colors.destructive }
        : { bg: colors.warningSoft, fg: colors.warningForeground };

  const display = row?.user_display_name ?? row?.user_email.split("@")[0] ?? "Applicant";

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Submission" subtitle={submissionId ? `…${submissionId.slice(0, 8)}` : undefined} back />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {loading && !row ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 32 }}>
              Loading submission…
            </AppText>
          ) : error && !row ? (
            <EmptyState
              icon={<UserX size={26} color={colors.destructive} />}
              title="Couldn't load this submission"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : row ? (
            <>
              <View
                style={[
                  {
                    borderRadius: radius["2xl"],
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    padding: 16,
                    alignItems: "center",
                    ...shadows.soft,
                  },
                ]}
              >
                <Avatar size={72} src={null} name={display} fallback={display.slice(0, 2).toUpperCase()} />
                <AppText size="lg" family="display" weight={800} style={{ marginTop: 10 }}>
                  {display}
                </AppText>
                <AppText size="xs" color={colors.mutedForeground}>{row.user_email}</AppText>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <View style={{ borderRadius: radius.full, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 3 }}>
                    {row.verification_type === "government_id" ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <IdCard size={12} color={colors.primary} />
                        <AppText size="xs" weight={700} color={colors.primary}>Government ID</AppText>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <GraduationCap size={12} color={colors.primary} />
                        <AppText size="xs" weight={700} color={colors.primary}>Student</AppText>
                      </View>
                    )}
                  </View>
                  <View style={{ borderRadius: radius.full, backgroundColor: statusTone.bg, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <AppText size="xs" weight={700} color={statusTone.fg}>{row.status.replace(/_/g, " ")}</AppText>
                  </View>
                </View>
              </View>

              <Section title="Application">
                <InfoRow label="Submitted" value={new Date(row.submitted_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} />
                {row.reviewed_at ? (
                  <InfoRow label="Reviewed" value={new Date(row.reviewed_at).toLocaleString(undefined, { day: "numeric", month: "short" })} />
                ) : null}
                {row.government_id_kind ? <InfoRow label="ID kind" value={row.government_id_kind} /> : null}
                {row.university_email ? <InfoRow label="University email" value={row.university_email} /> : null}
                {row.rejection_reason ? <InfoRow label="Rejection reason" value={row.rejection_reason} /> : null}
              </Section>

              {docs.length > 0 ? (
                <Section title="Documents">
                  {docs.map((d) => (
                    <Pressable
                      key={d.label}
                      disabled={!d.url}
                      onPress={() => d.url && Linking.openURL(d.url)}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          paddingVertical: 10,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <View style={{ height: 34, width: 34, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                        <FileText size={15} color={colors.primary} />
                      </View>
                      <AppText size="sm" weight={600} style={{ flex: 1 }}>{d.label}</AppText>
                      {d.url ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <ExternalLink size={13} color={colors.primary} />
                          <AppText size="xs" weight={600} color={colors.primary}>View</AppText>
                        </View>
                      ) : (
                        <AppText size="xs" color={colors.mutedForeground}>Not submitted</AppText>
                      )}
                    </Pressable>
                  ))}
                  <AppText size="xs" color={colors.mutedForeground} style={{ paddingBottom: 8 }}>
                    Document links expire after 5 minutes for security.
                  </AppText>
                </Section>
              ) : null}

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
                  {row.status === "pending" || row.status === "resubmission_requested" ? (
                    <View style={{ gap: 8 }}>
                      <Button variant="default" onPress={() => setAction("approve")} style={{ height: 44, borderRadius: radius.lg }}>
                        Approve submission
                      </Button>
                      <Button variant="destructive" onPress={() => setAction("reject")} style={{ height: 44, borderRadius: radius.lg }}>
                        Reject submission
                      </Button>
                      <Button variant="secondary" onPress={() => setAction("request_resubmission")} style={{ height: 44, borderRadius: radius.lg }}>
                        Request resubmission
                      </Button>
                    </View>
                  ) : (
                    <AppText size="xs" color={colors.mutedForeground}>
                      This submission was already reviewed — no further action is available.
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
                  <AppText size="sm" weight={700}>Read-only view</AppText>
                  <AppText size="xs" color={colors.mutedForeground} style={{ textAlign: "center" }}>
                    Your role can view this submission but not review it.
                  </AppText>
                </View>
              )}

              <ActionDialog
                visible={action !== null}
                title={actionConfig?.title ?? ""}
                body={actionConfig?.body}
                confirmLabel={actionConfig?.confirm ?? ""}
                tone={actionConfig?.tone}
                requireReason={actionConfig?.requireReason}
                reasonPlaceholder="Reason shown to the member…"
                busy={actionBusy}
                error={actionError}
                onClose={() => {
                  setAction(null);
                  setActionError(null);
                }}
                onConfirm={(reason) => void submitReview(reason)}
              />

              {error ? (
                <View>
                  <AppText size="xs" color={colors.destructive} style={{ textAlign: "center" }}>{error}</AppText>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
