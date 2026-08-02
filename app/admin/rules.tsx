import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { CheckCircle2, Scale, ShieldAlert } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { adminListModerationRules, adminUpdateModerationRule } from "@/services/admin";
import { can } from "@/types/admin";
import type { ModerationRuleRow } from "@/types/admin";

function RuleRow({
  rule,
  onEdit,
}: {
  rule: ModerationRuleRow;
  onEdit: () => void;
}) {
  return (
    <View
      style={[
        {
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 14,
          gap: 6,
          ...shadows.soft,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <AppText size="sm" weight={700} style={{ flex: 1 }}>
          {rule.rule_name.replace(/_/g, " ")}
        </AppText>
        <View
          style={{
            borderRadius: radius.full,
            backgroundColor: rule.enabled ? colors.successSoft : colors.secondary,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <AppText size="xs" weight={700} color={rule.enabled ? colors.success : colors.mutedForeground}>
            {rule.enabled ? "Enabled" : "Disabled"}
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {rule.threshold != null ? (
          <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 3 }}>
            <AppText size="xs" weight={600} color={colors.secondaryForeground}>≥ {rule.threshold}</AppText>
          </View>
        ) : null}
        {rule.action_type ? (
          <View style={{ borderRadius: radius.full, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 3 }}>
            <AppText size="xs" weight={600} color={colors.primary}>{rule.action_type.replace(/_/g, " ")}</AppText>
          </View>
        ) : null}
        {rule.duration_hours != null ? (
          <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 3 }}>
            <AppText size="xs" weight={600} color={colors.secondaryForeground}>{rule.duration_hours}h</AppText>
          </View>
        ) : null}
        <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 3 }}>
          <AppText size="xs" weight={600} color={colors.secondaryForeground}>severity {rule.severity}</AppText>
        </View>
      </View>
      <Button variant="outline" size="sm" onPress={onEdit} style={{ alignSelf: "flex-start", marginTop: 4 }}>
        Edit
      </Button>
    </View>
  );
}

export default function AdminRules() {
  const { adminRole } = useAuth();
  const canConfigure = can(adminRole, "moderation.configure");
  const [rules, setRules] = useState<ModerationRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ModerationRuleRow | null>(null);
  const [threshold, setThreshold] = useState("");
  const [duration, setDuration] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const load = useCallback(async (refreshingNow = false) => {
    if (refreshingNow) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await adminListModerationRules();
      setRules(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Couldn't load moderation rules.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (rule: ModerationRuleRow) => {
    setEditing(rule);
    setThreshold(rule.threshold != null ? String(rule.threshold) : "");
    setDuration(rule.duration_hours != null ? String(rule.duration_hours) : "");
    setEnabled(rule.enabled);
    setSaveError(null);
  };

  const save = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      await adminUpdateModerationRule({
        ruleName: editing.rule_name,
        threshold: threshold.trim() ? Number(threshold.trim()) : null,
        actionType: editing.action_type,
        durationHours: duration.trim() ? Number(duration.trim()) : null,
        enabled,
      });
      setLastAction("Rule updated.");
      setEditing(null);
      await load();
    } catch (e) {
      setSaveError((e as Error).message || "Couldn't update the rule.");
    } finally {
      setSaving(false);
    }
  }, [editing, threshold, duration, enabled, load]);

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Moderation rules" subtitle="Automatic enforcement thresholds" back />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 10, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {!canConfigure ? (
            <EmptyState
              icon={<ShieldAlert size={26} color={colors.mutedForeground} />}
              title="Read-only"
              body="Your role can view moderation rules but not change them."
            />
          ) : loading ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 24 }}>
              Loading rules…
            </AppText>
          ) : error ? (
            <EmptyState
              icon={<Scale size={26} color={colors.primary} />}
              title="Couldn't load rules"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : (
            <>
              {lastAction ? (
                <StatusBanner tone="success" icon={<CheckCircle2 size={16} color={colors.success} />} title={lastAction} />
              ) : null}
              <AppText size="xs" color={colors.mutedForeground} style={{ lineHeight: 18 }}>
                Rules trigger automatically from reliability-event weights. Changes apply to new events only.
              </AppText>
              {rules.map((r) => (
                <RuleRow key={r.rule_name} rule={r} onEdit={() => openEditor(r)} />
              ))}
            </>
          )}
        </ScrollView>

        <Dialog visible={editing !== null} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.rule_name.replace(/_/g, " ")}` : ""}>
          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <AppText size="xs" weight={600} color={colors.mutedForeground}>Threshold (events)</AppText>
              <Input keyboardType="numeric" placeholder="Leave blank for none" value={threshold} onChangeText={setThreshold} />
            </View>
            <View style={{ gap: 6 }}>
              <AppText size="xs" weight={600} color={colors.mutedForeground}>Duration (hours)</AppText>
              <Input keyboardType="numeric" placeholder="Leave blank for none" value={duration} onChangeText={setDuration} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <AppText size="sm" weight={600}>Rule enabled</AppText>
              <Switch value={enabled} onValueChange={setEnabled} />
            </View>
            {saveError ? (
              <AppText size="xs" color={colors.destructive}>{saveError}</AppText>
            ) : null}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button variant="outline" onPress={() => setEditing(null)} disabled={saving} style={{ flex: 1, height: 44, borderRadius: radius.lg }}>
                Cancel
              </Button>
              <Button onPress={() => void save()} disabled={saving} style={{ flex: 1, height: 44, borderRadius: radius.lg }}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </View>
          </View>
        </Dialog>
      </Screen>
    </PhoneShell>
  );
}
