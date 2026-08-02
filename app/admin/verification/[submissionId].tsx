import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { BadgeCheck, ExternalLink, FileText, GraduationCap, IdCard, UserX } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { adminListVerifications } from "@/services/admin";
import { getPrivateSignedUrl } from "@/services/storage";
import { VERIFICATION_DOCUMENTS_BUCKET } from "@/types/verification";
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

export default function AdminSubmissionDetail() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const [row, setRow] = useState<VerificationQueueRow | null>(null);
  const [docs, setDocs] = useState<Array<{ label: string; url: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                <BadgeCheck size={20} color={colors.primary} />
                <AppText size="sm" weight={700}>Review actions</AppText>
                <AppText size="xs" color={colors.mutedForeground} style={{ textAlign: "center" }}>
                  Approve, reject and resubmission tools arrive with the moderation batch.
                </AppText>
              </View>

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
