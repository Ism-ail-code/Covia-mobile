import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Car, CheckCircle2, ChevronRight, Flag } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { ActionDialog } from "@/components/admin/ActionDialog";
import { useAuth } from "@/context/AuthContext";
import { adminCancelRide, adminGetRideDetails, adminGetRideTimeline } from "@/services/admin";
import { can } from "@/types/admin";
import type { AdminRideDetails, AdminTimelineEvent } from "@/types/admin";
import { naira } from "@/lib/format";

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

export default function AdminRideDetail() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const { adminRole } = useAuth();
  const canCancel = can(adminRole, "ride.cancel");
  const [ride, setRide] = useState<AdminRideDetails | null>(null);
  const [timeline, setTimeline] = useState<AdminTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (!rideId) return;
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const [d, t] = await Promise.all([adminGetRideDetails(rideId), adminGetRideTimeline(rideId)]);
        setRide(d);
        setTimeline(t);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load this ride.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rideId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const submitCancel = useCallback(
    async (reason: string) => {
      if (!rideId) return;
      setCancelBusy(true);
      setCancelError(null);
      try {
        await adminCancelRide(rideId, reason);
        setLastAction("Ride cancelled — participants and the host have been notified.");
        setCancelOpen(false);
        await load();
      } catch (e) {
        setCancelError((e as Error).message || "Couldn't cancel the ride.");
      } finally {
        setCancelBusy(false);
      }
    },
    [rideId, load],
  );

  const cancellable = ride && !["cancelled", "completed", "expired"].includes(ride.ride_status);

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Ride" subtitle={rideId ? `…${rideId.slice(0, 8)}` : undefined} back />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 16, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {loading && !ride ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 32 }}>
              Loading ride…
            </AppText>
          ) : error && !ride ? (
            <EmptyState
              icon={<Car size={26} color={colors.destructive} />}
              title="Couldn't load this ride"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : ride ? (
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
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <AppText size="xs" weight={700} color={colors.primary} style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {ride.ride_status.replace("_", " ")}
                  </AppText>
                  <AppText size="xs" color={colors.mutedForeground}>
                    {new Date(ride.departure_time).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                  </AppText>
                </View>
                <AppText size="xl" family="display" weight={800} style={{ marginTop: 10 }}>
                  {ride.origin} → {ride.destination}
                </AppText>
                {ride.pickup_point ? (
                  <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 2 }}>
                    Pickup: {ride.pickup_point}
                  </AppText>
                ) : null}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <AppText size="xs" weight={700} color={colors.secondaryForeground}>
                      {ride.total_seats - ride.available_seats}/{ride.total_seats} seats taken
                    </AppText>
                  </View>
                  <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <AppText size="xs" weight={700} color={colors.secondaryForeground}>
                      {ride.fare_mode === "fixed" && ride.fixed_fare != null ? naira(Number(ride.fixed_fare)) : "Flexible fare"}
                    </AppText>
                  </View>
                  {ride.is_women_only ? (
                    <View style={{ borderRadius: radius.full, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <AppText size="xs" weight={700} color={colors.primary}>Women only</AppText>
                    </View>
                  ) : null}
                  {ride.is_student_only ? (
                    <View style={{ borderRadius: radius.full, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <AppText size="xs" weight={700} color={colors.primary}>Students only</AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              {lastAction ? (
                <StatusBanner tone="success" icon={<CheckCircle2 size={16} color={colors.success} />} title={lastAction} />
              ) : null}

              {canCancel && cancellable ? (
                <View
                  style={[
                    {
                      borderRadius: radius["2xl"],
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      padding: 16,
                      gap: 8,
                      ...shadows.soft,
                    },
                  ]}
                >
                  <AppText size="sm" weight={700}>Moderation</AppText>
                  <AppText size="xs" color={colors.mutedForeground}>
                    Cancel the ride when it violates community rules. Participants are notified; the host is never penalized for an admin cancel.
                  </AppText>
                  <Button variant="destructive" onPress={() => setCancelOpen(true)} style={{ height: 44, borderRadius: radius.lg }}>
                    Cancel this ride
                  </Button>
                </View>
              ) : null}

              <Section title="Host">
                <Pressable
                  onPress={() => router.push(`/admin/users/${ride.host.user_id}`)}
                  style={({ pressed }) => [
                    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Avatar size={44} src={null} name={ride.host.display_name ?? ride.host.email} fallback={(ride.host.display_name ?? ride.host.email).slice(0, 2).toUpperCase()} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText size="sm" weight={700} numberOfLines={1}>{ride.host.display_name ?? ride.host.email}</AppText>
                    <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>
                      {ride.host.email} · ⭐ {ride.host.rating != null ? ride.host.rating.toFixed(1) : "—"} · {ride.host.verification_status}
                    </AppText>
                  </View>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
                <InfoRow label="Phone" value={ride.host.phone ?? "—"} />
                <InfoRow label="Reliability" value={ride.host.reliability_score != null ? `${ride.host.reliability_score}%` : "—"} />
              </Section>

              <Section title={`Participants (${ride.participants.length})`}>
                {ride.pending_requests > 0 ? (
                  <InfoRow label="Pending requests" value={String(ride.pending_requests)} />
                ) : null}
                {ride.participants.length === 0 ? (
                  <AppText size="xs" color={colors.mutedForeground} style={{ paddingVertical: 10 }}>
                    No confirmed participants yet.
                  </AppText>
                ) : (
                  ride.participants.map((p) => (
                    <Pressable
                      key={p.user_id}
                      onPress={() => router.push(`/admin/users/${p.user_id}`)}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          paddingVertical: 10,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Avatar size={36} src={null} name={p.display_name ?? p.username ?? "Rider"} fallback={(p.display_name ?? p.username ?? "R").slice(0, 2).toUpperCase()} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText size="sm" weight={600} numberOfLines={1}>{p.display_name ?? p.username ?? "Rider"}</AppText>
                        <AppText size="xs" color={colors.mutedForeground}>
                          {p.role.replace("_", " ")} · ⭐ {p.rating != null ? p.rating.toFixed(1) : "—"} · {p.reliability_score != null ? `${p.reliability_score}%` : "—"}
                        </AppText>
                      </View>
                      <ChevronRight size={14} color={colors.mutedForeground} />
                    </Pressable>
                  ))
                )}
              </Section>

              {ride.reports.length > 0 ? (
                <Section title={`Reports (${ride.reports.length})`}>
                  {ride.reports.map((r) => (
                    <View key={r.id} style={{ paddingVertical: 10, gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Flag size={13} color={colors.destructive} />
                        <AppText size="sm" weight={600} style={{ flex: 1 }}>
                          {r.reason}
                        </AppText>
                        <AppText size="xs" weight={700} color={r.status === "open" ? colors.destructive : colors.mutedForeground}>
                          {r.status}
                        </AppText>
                      </View>
                      {r.details ? (
                        <AppText size="xs" color={colors.mutedForeground}>{r.details}</AppText>
                      ) : null}
                      <AppText size="xs" color={colors.mutedForeground}>
                        By {r.reporter_name ?? "unknown"} · {new Date(r.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </AppText>
                    </View>
                  ))}
                </Section>
              ) : null}

              {timeline.length > 0 ? (
                <Section title="Timeline">
                  {timeline.map((t, i) => (
                    <View
                      key={t.id}
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        paddingVertical: 10,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <View style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary, marginTop: 5 }} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText size="sm" weight={600}>{t.event_type.replace(/_/g, " ")}</AppText>
                        <AppText size="xs" color={colors.mutedForeground}>
                          {new Date(t.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </Section>
              ) : null}

              {error ? <StatusBanner tone="warning" title="Some data failed to refresh" body={error} /> : null}

              <ActionDialog
                visible={cancelOpen}
                title="Cancel this ride"
                body="All confirmed participants will be notified. This is recorded in the audit log."
                confirmLabel="Cancel ride"
                requireReason
                reasonPlaceholder="Reason for cancellation (shown to participants)…"
                busy={cancelBusy}
                error={cancelError}
                onClose={() => {
                  setCancelOpen(false);
                  setCancelError(null);
                }}
                onConfirm={(reason) => void submitCancel(reason)}
              />
            </>
          ) : null}
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
