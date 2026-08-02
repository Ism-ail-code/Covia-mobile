import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, ShieldAlert, UserX } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { adminGetCaseHistory, adminGetUserProfile, adminGetUserRideHistory } from "@/services/admin";
import type { AdminUserProfile, CaseHistory } from "@/types/admin";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 8 }}>
      <AppText size="xs" color={colors.mutedForeground} weight={600}>
        {label}
      </AppText>
      <AppText size="sm" weight={600} numberOfLines={1} style={{ flexShrink: 1, textAlign: "right" }}>
        {value}
      </AppText>
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

export default function AdminUserDetail() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);
  const [caseHistory, setCaseHistory] = useState<CaseHistory | null>(null);
  const [recentRides, setRecentRides] = useState<Array<{ ride_id: string; origin: string; destination: string; ride_status: string; departure_time: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (!userId) return;
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const [p, c, rides] = await Promise.all([
          adminGetUserProfile(userId),
          adminGetCaseHistory(userId),
          adminGetUserRideHistory(userId, 1, 5),
        ]);
        setProfile(p);
        setCaseHistory(c);
        setRecentRides(rides);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load this user.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const display = profile?.display_name ?? profile?.username ?? "User";
  const initials = display.slice(0, 2).toUpperCase();

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="User" subtitle={userId ? `…${userId.slice(0, 8)}` : undefined} back />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {loading && !profile ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 32 }}>
              Loading user…
            </AppText>
          ) : error && !profile ? (
            <EmptyState
              icon={<UserX size={26} color={colors.destructive} />}
              title="Couldn't load this user"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : profile ? (
            <>
              {profile.is_banned ? (
                <StatusBanner tone="danger" icon={<UserX size={16} color={colors.destructive} />} title="Banned account" />
              ) : profile.is_suspended ? (
                <StatusBanner tone="warning" icon={<ShieldAlert size={16} color={colors.warningForeground} />} title="Suspended account" />
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
                    ...shadows.soft,
                  },
                ]}
              >
                <Avatar size={72} src={null} name={display} fallback={initials} ring={profile.is_banned ? { color: colors.destructive, width: 4 } : "primarySoft"} />
                <AppText size="lg" family="display" weight={800} style={{ marginTop: 10 }}>
                  {display}
                </AppText>
                <AppText size="xs" color={colors.mutedForeground}>
                  {profile.email}
                </AppText>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <View style={{ borderRadius: radius.full, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <AppText size="xs" weight={700} color={colors.primary}>{profile.verification_status}</AppText>
                  </View>
                  <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <AppText size="xs" weight={700} color={colors.secondaryForeground}>
                      ⭐ {profile.rating != null ? profile.rating.toFixed(1) : "—"}
                    </AppText>
                  </View>
                  <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <AppText size="xs" weight={700} color={colors.secondaryForeground}>
                      {profile.reliability_score}% reliable
                    </AppText>
                  </View>
                </View>
              </View>

              <Section title="Account">
                <InfoRow label="Username" value={profile.username ? `@${profile.username}` : "—"} />
                <InfoRow label="Phone" value={profile.phone ?? "—"} />
                <InfoRow label="Home city" value={profile.home_city ?? "—"} />
                <InfoRow label="Joined" value={new Date(profile.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} />
                <InfoRow label="Completed rides" value={String(profile.total_completed_rides)} />
                <InfoRow label="Cancelled rides" value={String(profile.total_cancelled_rides)} />
                <InfoRow label="Reports received" value={String(profile.reports_received_total)} />
              </Section>

              <Section title="Verification">
                <InfoRow label="Government ID" value={profile.is_government_id_verified ? "Verified" : "Not verified"} />
                <InfoRow label="Student" value={profile.is_student_verified ? "Verified" : "Not verified"} />
                {profile.latest_verification ? (
                  <>
                    <InfoRow label="Latest submission" value={profile.latest_verification.verification_type.replace("_", " ")} />
                    <InfoRow label="Submission status" value={profile.latest_verification.status} />
                    {profile.latest_verification.rejection_reason ? (
                      <InfoRow label="Rejection reason" value={profile.latest_verification.rejection_reason} />
                    ) : null}
                  </>
                ) : null}
              </Section>

              {caseHistory ? (
                <Section title="Case history">
                  <InfoRow label="Active restrictions" value={String(profile.active_restrictions)} />
                  <InfoRow label="Moderation actions" value={String(caseHistory.moderation_actions.length)} />
                  <InfoRow label="Reports filed" value={String(caseHistory.reports_filed.length)} />
                  <InfoRow label="Reports received" value={String(caseHistory.reports_received.length)} />
                  <InfoRow label="Appeals" value={String(caseHistory.appeals.length)} />
                  <InfoRow label="Reliability events" value={String(caseHistory.reliability_events.length)} />
                </Section>
              ) : null}

              {recentRides.length > 0 ? (
                <Section title="Recent rides">
                  {recentRides.map((r, i) => (
                    <Pressable
                      key={r.ride_id}
                      onPress={() => router.push(`/admin/rides/${r.ride_id}`)}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          paddingVertical: 10,
                          borderTopWidth: i === 0 ? 0 : 1,
                          borderTopColor: colors.border,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText size="sm" weight={600} numberOfLines={1}>{r.origin} → {r.destination}</AppText>
                        <AppText size="xs" color={colors.mutedForeground}>
                          {new Date(r.departure_time).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {r.ride_status}
                        </AppText>
                      </View>
                      <ArrowRight size={14} color={colors.mutedForeground} />
                    </Pressable>
                  ))}
                </Section>
              ) : null}

              {error ? <StatusBanner tone="warning" title="Some data failed to refresh" body={error} /> : null}
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
