import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, ChevronRight, Gavel, ShieldAlert } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { ActionDialog } from "@/components/admin/ActionDialog";
import { useAuth } from "@/context/AuthContext";
import { adminDecideAppeal, adminListAppeals } from "@/services/admin";
import { can } from "@/types/admin";
import type { AppealRow } from "@/types/admin";

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

export default function AdminAppealDetail() {
  const { appealId } = useLocalSearchParams<{ appealId: string }>();
  const router = useRouter();
  const { adminRole } = useAuth();
  const canDecide = can(adminRole, "appeal.decide");
  const [appeal, setAppeal] = useState<AppealRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (!appealId) return;
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const page = await adminListAppeals({ status: null, page: 1, pageSize: 100 });
        const match = page.items.find((a) => a.id === appealId);
        if (!match) throw new Error("Appeal not found.");
        setAppeal(match);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load this appeal.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appealId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (note: string) => {
      if (!appeal || !action) return;
      setActionBusy(true);
      setActionError(null);
      try {
        await adminDecideAppeal(appeal.id, action === "approve", note || null);
        setLastAction(action === "approve" ? "Appeal approved." : "Appeal rejected.");
        setAction(null);
        await load();
      } catch (e) {
        setActionError((e as Error).message || "Couldn't decide the appeal.");
      } finally {
        setActionBusy(false);
      }
    },
    [appeal, action, load],
  );

  const open = appeal && ["pending", "under_review"].includes(appeal.status);
  const display = appeal?.user_name ?? "Member";

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Appeal" subtitle={appealId ? `…${appealId.slice(0, 8)}` : undefined} back />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {loading && !appeal ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 32 }}>
              Loading appeal…
            </AppText>
          ) : error && !appeal ? (
            <EmptyState
              icon={<Gavel size={26} color={colors.destructive} />}
              title="Couldn't load this appeal"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : appeal ? (
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
                  <View style={{ height: 40, width: 40, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                    <Gavel size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText size="base" family="display" weight={700}>
                      Appeal against {appeal.action_type.replace(/_/g, " ")}
                    </AppText>
                    <AppText size="xs" color={colors.mutedForeground}>
                      {appeal.status.replace(/_/g, " ")} · {new Date(appeal.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </AppText>
                  </View>
                </View>
                <View
                  style={{
                    borderRadius: radius.lg,
                    backgroundColor: colors.secondary,
                    padding: 12,
                    marginTop: 12,
                  }}
                >
                  <AppText size="sm" weight={500} style={{ lineHeight: 20 }}>
                    “{appeal.appeal_reason}”
                  </AppText>
                </View>
              </View>

              <Section title="Member">
                <Pressable
                  onPress={() => appeal.user_id && router.push(`/admin/users/${appeal.user_id}`)}
                  style={({ pressed }) => [
                    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Avatar size={40} src={null} name={display} fallback={display.slice(0, 2).toUpperCase()} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText size="sm" weight={600} numberOfLines={1}>{display}</AppText>
                    <AppText size="xs" color={colors.mutedForeground}>Appellant</AppText>
                  </View>
                  <ChevronRight size={14} color={colors.mutedForeground} />
                </Pressable>
              </Section>

              <Section title="Details">
                <InfoRow label="Status" value={appeal.status.replace(/_/g, " ")} />
                <InfoRow label="Moderation action" value={appeal.action_type.replace(/_/g, " ")} />
                <InfoRow label="Moderation action ID" value={appeal.moderation_action_id.slice(0, 8)} />
                {appeal.moderator_note ? <InfoRow label="Moderator note" value={appeal.moderator_note} /> : null}
                {appeal.decided_at ? (
                  <InfoRow label="Decided" value={new Date(appeal.decided_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })} />
                ) : null}
                <InfoRow label="Submitted" value={new Date(appeal.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} />
              </Section>

              {lastAction ? (
                <StatusBanner tone="success" icon={<CheckCircle2 size={16} color={colors.success} />} title={lastAction} />
              ) : null}

              {canDecide ? (
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
                  <AppText size="sm" weight={700}>Decision</AppText>
                  {open ? (
                    <View style={{ gap: 8 }}>
                      <Button variant="default" onPress={() => setAction("approve")} style={{ height: 44, borderRadius: radius.lg }}>
                        Approve appeal
                      </Button>
                      <Button variant="destructive" onPress={() => setAction("reject")} style={{ height: 44, borderRadius: radius.lg }}>
                        Reject appeal
                      </Button>
                    </View>
                  ) : (
                    <AppText size="xs" color={colors.mutedForeground}>
                      This appeal was already decided.
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
                    Your role can view appeals but not decide them.
                  </AppText>
                </View>
              )}

              <ActionDialog
                visible={action !== null}
                title={action === "approve" ? "Approve appeal" : "Reject appeal"}
                body={
                  action === "approve"
                    ? "Approving reverses the underlying moderation action."
                    : "Rejecting keeps the moderation action in place."
                }
                confirmLabel={action === "approve" ? "Approve" : "Reject"}
                tone={action === "approve" ? "default" : "destructive"}
                requireReason={false}
                reasonPlaceholder="Optional note for the member…"
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
