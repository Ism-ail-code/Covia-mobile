import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { BadgeCheck, ChevronRight, GraduationCap, IdCard, Search } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { adminListVerifications } from "@/services/admin";
import type { VerificationQueueRow } from "@/types/admin";

const STATUS_FILTERS = ["pending", "in_review", "approved", "rejected", "resubmission_requested"];
const TYPE_FILTERS = ["All", "government_id", "student"];

function VerificationRow({ row }: { row: VerificationQueueRow }) {
  const router = useRouter();
  const display = row.user_display_name ?? row.user_email.split("@")[0];
  const statusTone =
    row.status === "approved"
      ? { bg: colors.successSoft, fg: colors.success }
      : row.status === "rejected"
        ? { bg: colors.destructiveSoft, fg: colors.destructive }
        : { bg: colors.warningSoft, fg: colors.warningForeground };
  return (
    <Pressable
      onPress={() => router.push(`/admin/verification/${row.id}`)}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 12,
          ...shadows.soft,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <Avatar size={44} src={null} name={display} fallback={display.slice(0, 2).toUpperCase()} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AppText size="sm" weight={700} numberOfLines={1} style={{ flexShrink: 1 }}>{display}</AppText>
          {row.verification_type === "government_id" ? (
            <IdCard size={13} color={colors.primary} />
          ) : (
            <GraduationCap size={13} color={colors.primary} />
          )}
        </View>
        <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>{row.user_email}</AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
          <View style={{ borderRadius: radius.full, backgroundColor: statusTone.bg, paddingHorizontal: 8, paddingVertical: 2 }}>
            <AppText size="xs" weight={700} color={statusTone.fg}>{row.status.replace(/_/g, " ")}</AppText>
          </View>
          <AppText size="xs" color={colors.mutedForeground}>
            {new Date(row.submitted_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </AppText>
        </View>
      </View>
      <ChevronRight size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function AdminVerification() {
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("All");
  const [rows, setRows] = useState<VerificationQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await adminListVerifications({
          status,
          verificationType: type === "All" ? null : type,
        });
        setRows(data);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load the verification queue.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status, type],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = status === "pending" ? rows.length : undefined;

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Review queue" subtitle={pendingCount != null ? `${pendingCount} pending` : undefined} />
        <View style={{ paddingHorizontal: gutter, gap: 10, paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {STATUS_FILTERS.map((s) => (
              <Chip key={s} active={status === s} onPress={() => setStatus(s)}>
                {s.replace(/_/g, " ")}
              </Chip>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {TYPE_FILTERS.map((t) => (
              <Chip key={t} active={type === t} onPress={() => setType(t)}>
                {t === "All" ? t : t.replace(/_/g, " ")}
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
              Loading queue…
            </AppText>
          ) : error && rows.length === 0 ? (
            <EmptyState
              icon={<BadgeCheck size={26} color={colors.primary} />}
              title="Couldn't load the queue"
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
              title="Nothing here"
              body={`No ${status.replace(/_/g, " ")} submissions${type !== "All" ? ` of ${type.replace(/_/g, " ")}` : ""}.`}
            />
          ) : (
            rows.map((r) => <VerificationRow key={r.id} row={r} />)
          )}
        </ScrollView>
        <AdminTabBar />
      </Screen>
    </PhoneShell>
  );
}
