import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { CheckCircle2, ShieldAlert } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getSafetyConfig } from "@/services/safety";
import { adminUpdateSafetyConfig } from "@/services/admin";
import { can } from "@/types/admin";
import type { SafetyConfig } from "@/types/safety";

function NumericField({
  label,
  hint,
  value,
  onChange,
  suffix,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <AppText size="xs" weight={700} color={colors.mutedForeground} style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </AppText>
        <AppText size="xs" color={colors.mutedForeground}>{hint}</AppText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Input keyboardType="numeric" value={value} onChangeText={onChange} style={{ flex: 1 }} />
        <AppText size="xs" weight={600} color={colors.mutedForeground}>{suffix}</AppText>
      </View>
    </View>
  );
}

export default function AdminSafetyConfig() {
  const { adminRole } = useAuth();
  const canManage = can(adminRole, "config.manage");
  const [config, setConfig] = useState<SafetyConfig | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async (refreshingNow = false) => {
    if (refreshingNow) setRefreshing(true);
    else setLoading(true);
    try {
      const c = await getSafetyConfig();
      setConfig(c);
      setForm({
        routeDeviationMeters: String(c.routeDeviationMeters),
        stopThresholdSeconds: String(c.stopThresholdSeconds),
        safetyCheckTimeoutSeconds: String(c.safetyCheckTimeoutSeconds),
        neverStartedMinutes: String(c.neverStartedMinutes),
        exceededDurationMinutes: String(c.exceededDurationMinutes),
        sosRepeatWindowSeconds: String(c.sosRepeatWindowSeconds),
        liveLocationRetentionHours: String(c.liveLocationRetentionHours),
      });
      setNotify(c.notifyParticipantsOnSos);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Couldn't load the safety configuration.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const num = (key: string) => {
    const raw = form[key]?.trim();
    return raw ? Number(raw) : null;
  };

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await adminUpdateSafetyConfig({
        routeDeviationMeters: num("routeDeviationMeters"),
        stopThresholdSeconds: num("stopThresholdSeconds"),
        safetyCheckTimeoutSeconds: num("safetyCheckTimeoutSeconds"),
        neverStartedMinutes: num("neverStartedMinutes"),
        exceededDurationMinutes: num("exceededDurationMinutes"),
        notifyParticipantsOnSos: notify,
        sosRepeatWindowSeconds: num("sosRepeatWindowSeconds"),
        liveLocationRetentionHours: num("liveLocationRetentionHours"),
      });
      setSaved(true);
      await load();
    } catch (e) {
      setSaveError((e as Error).message || "Couldn't save the safety configuration.");
    } finally {
      setSaving(false);
    }
  }, [form, notify, load]);

  const set = (key: string) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Safety config" subtitle={config ? `Updated ${new Date(config.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : undefined} back />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {!canManage ? (
            <EmptyState
              icon={<ShieldAlert size={26} color={colors.mutedForeground} />}
              title="Read-only"
              body="Your role can view the safety configuration but not change it."
            />
          ) : loading && !config ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 24 }}>
              Loading configuration…
            </AppText>
          ) : error && !config ? (
            <EmptyState
              icon={<ShieldAlert size={26} color={colors.destructive} />}
              title="Couldn't load the configuration"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : config ? (
            <>
              {saved ? (
                <StatusBanner tone="success" icon={<CheckCircle2 size={16} color={colors.success} />} title="Configuration saved." />
              ) : null}

              <View style={{ gap: 14 }}>
                <NumericField label="Route deviation" hint="before flagging" suffix="meters" value={form.routeDeviationMeters ?? ""} onChange={set("routeDeviationMeters")} />
                <NumericField label="Stopped threshold" hint="moving without progress" suffix="seconds" value={form.stopThresholdSeconds ?? ""} onChange={set("stopThresholdSeconds")} />
                <NumericField label="Safety check timeout" hint="unanswered check" suffix="seconds" value={form.safetyCheckTimeoutSeconds ?? ""} onChange={set("safetyCheckTimeoutSeconds")} />
                <NumericField label="Never-started window" hint="after departure" suffix="minutes" value={form.neverStartedMinutes ?? ""} onChange={set("neverStartedMinutes")} />
                <NumericField label="Exceeded-duration window" hint="over estimate" suffix="minutes" value={form.exceededDurationMinutes ?? ""} onChange={set("exceededDurationMinutes")} />
                <NumericField label="SOS repeat window" hint="between repeats" suffix="seconds" value={form.sosRepeatWindowSeconds ?? ""} onChange={set("sosRepeatWindowSeconds")} />
                <NumericField label="Live location retention" hint="after ride ends" suffix="hours" value={form.liveLocationRetentionHours ?? ""} onChange={set("liveLocationRetentionHours")} />

                <View
                  style={{
                    borderRadius: radius["2xl"],
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...shadows.soft,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <AppText size="sm" weight={700}>Notify participants on SOS</AppText>
                    <AppText size="xs" color={colors.mutedForeground}>Alerts all ride participants when an SOS is raised.</AppText>
                  </View>
                  <Switch value={notify} onValueChange={setNotify} />
                </View>

                {saveError ? (
                  <AppText size="xs" color={colors.destructive}>{saveError}</AppText>
                ) : null}

                <Button onPress={() => void save()} disabled={saving} style={{ height: 48, borderRadius: radius.lg }}>
                  {saving ? "Saving…" : "Save configuration"}
                </Button>
              </View>
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
