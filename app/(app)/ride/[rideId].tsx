import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Users,
  ShieldCheck,
  MessageCircle,
  Clock,
  BadgeCheck,
  RefreshCw,
  Check,
  X,
} from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { MapPlaceholder, RouteLine } from "@/components/app/RouteLine";
import { RideTimeline } from "@/components/app/RideTimeline";
import { Rating, StatBlock } from "@/components/app/Badges";
import { Chip } from "@/components/ui/Chip";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import {
  cancelRideRequest,
  cancelRide,
  completeRide,
  getRide,
  getRideParticipants,
  getRideRequests,
  getRideTimeline,
  hostRespondToRequest,
  leaveRide,
  requestToJoin,
  startRide,
  RideError,
} from "@/services/rides";
import {
  FARE_MODE_LABELS,
  PICKUP_TYPE_LABELS,
  type Ride,
  type RideParticipant,
  type RideRequestWithPassenger,
  type RideTimelineEvent,
} from "@/types/ride";

const naira = (n: number) => `₦${n.toLocaleString()}`;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  return `${sameDay(d, now) ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

const currentStep = (status: Ride["rideStatus"]) =>
  status === "in_progress" ? 4 : status === "completed" || status === "cancelled" || status === "expired" ? 99 : 2;

export default function RideDetails() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const me = user?.id;

  const [ride, setRide] = useState<Ride | null>(null);
  const [participants, setParticipants] = useState<RideParticipant[]>([]);
  const [requests, setRequests] = useState<RideRequestWithPassenger[]>([]);
  const [timeline, setTimeline] = useState<RideTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const load = useCallback(
    async (notify = true) => {
      if (!rideId) return;
      try {
        setError(null);
        const [r, members, events] = await Promise.all([
          getRide(rideId),
          getRideParticipants(rideId),
          getRideTimeline(rideId),
        ]);
        setRide(r);
        setParticipants(members);
        setTimeline(events);
        if (r.hostId === me) {
          const queue = await getRideRequests(rideId).catch(() => [] as RideRequestWithPassenger[]);
          setRequests(queue);
        }
      } catch (e) {
        setError(e instanceof RideError ? e.message : "Couldn't load this ride.");
      } finally {
        setLoading(false);
      }
      return notify;
    },
    [rideId, me],
  );

  useEffect(() => {
    load();
  }, [load]);

  const isHost = ride?.hostId === me;
  const myRequest = useMemo(
    () => requests.find((r) => r.passengerId === me && r.status === "pending"),
    [requests, me],
  );
  const isMember = participants.some((p) => p.userId === me && !p.leftAt);
  const activeMembers = participants.filter((p) => !p.leftAt);
  const host = activeMembers.find((p) => p.role === "Host") ?? null;
  const passengers = activeMembers.filter((p) => p.role === "Passenger");
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const canRequest =
    !isHost && !isMember && !myRequest && ride != null &&
    (ride.rideStatus === "published" || ride.rideStatus === "full") &&
    ride.availableSeats > 0;

  const act = async (fn: () => Promise<unknown>, successMsg: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      await load();
    } catch (e) {
      toast.error(e instanceof RideError ? e.message : "Couldn't do that — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !ride) {
    return (
      <PhoneShell>
        <TopBar title="Ride details" back onBack={() => router.back()} />
        <Screen>
          <View style={{ padding: 40, alignItems: "center", gap: 8 }}>
            <AppText size="sm" color={colors.mutedForeground}>
              Loading ride…
            </AppText>
          </View>
        </Screen>
      </PhoneShell>
    );
  }

  if (error && !ride) {
    return (
      <PhoneShell>
        <TopBar title="Ride details" back onBack={() => router.back()} />
        <Screen>
          <EmptyState
            icon={<RefreshCw size={28} color={colors.destructive} />}
            title="Couldn't load this ride"
            body={error}
            action={
              <Button variant="outline" onPress={() => { setLoading(true); load(); }}>
                <AppText size="sm" weight={600} color={colors.primary}>
                  Try again
                </AppText>
              </Button>
            }
          />
        </Screen>
      </PhoneShell>
    );
  }

  if (!ride) return null;

  const fare = ride.fareMode === "fixed" ? naira(ride.fixedFare ?? 0) : "Smart split";
  const hostName = host?.displayName ?? ride.hostDisplayName ?? "Covia host";
  const hostInitials = hostName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <PhoneShell>
      <TopBar title="Ride details" subtitle={formatWhen(ride.departureTime)} back onBack={() => router.back()} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 128, gap: 16 }}>
          <MapPlaceholder height={208} label={`${ride.distanceKm != null ? `${ride.distanceKm} km route` : "Route"}`} />

          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <View style={[styles.card]}>
              <RouteLine
                pickup={ride.pickupPoint || ride.origin}
                destination={ride.destination}
                landmark={ride.pickupPointLoc?.full_address ?? undefined}
              />
              <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
                <StatBlock label="Departs" value={formatWhen(ride.departureTime).split(" · ")[1]} />
                <StatBlock label="Seats left" value={`${ride.availableSeats}`} />
                <StatBlock label="Per seat" value={fare} />
              </View>
              <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {ride.isWomenOnly ? <Chip>Women only</Chip> : null}
                {ride.isStudentOnly ? <Chip>Students only</Chip> : null}
                <Chip>{FARE_MODE_LABELS[ride.fareMode]}</Chip>
                {ride.pickupType ? <Chip>{PICKUP_TYPE_LABELS[ride.pickupType]}</Chip> : null}
              </View>
            </View>

            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
              <Avatar size={48} src={host?.avatarUrl ?? ride.hostAvatarUrl ?? undefined} fallback={hostInitials} ring="primarySoft" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <AppText size="sm" weight={600} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {hostName}
                  </AppText>
                  <Rating value={host?.rating ?? ride.hostRating ?? 0} />
                </View>
                <View style={{ marginTop: 4, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  {ride.hostVerified || host?.reliabilityScore != null ? (
                    <>
                      {ride.hostVerified ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <BadgeCheck size={13} color={colors.primary} strokeWidth={2.5} />
                          <AppText size="xs" weight={600} color={colors.primary} style={{ fontSize: 10 }}>
                            ID verified
                          </AppText>
                        </View>
                      ) : null}
                      {host?.reliabilityScore != null ? (
                        <AppText size="xs" weight={600} color={colors.success} style={{ fontSize: 10 }}>
                          {host.reliabilityScore}% reliable
                        </AppText>
                      ) : null}
                    </>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={[styles.card]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Users size={16} color={colors.primary} />
                <AppText size="sm" weight={600}>
                  Covians ({activeMembers.length})
                </AppText>
              </View>
              {activeMembers.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {activeMembers.map((p) => (
                    <View key={p.userId} style={{ width: 64, alignItems: "center", gap: 4 }}>
                      <Avatar
                        size={44}
                        src={p.avatarUrl ?? undefined}
                        fallback={(p.displayName ?? "C")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      />
                      <AppText size="xs" color={colors.mutedForeground} numberOfLines={1} style={{ fontSize: 10 }}>
                        {p.userId === me ? "You" : (p.displayName ?? "Covian").split(" ")[0]}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : (
                <AppText size="xs" color={colors.mutedForeground}>
                  No one has joined yet.
                </AppText>
              )}
            </View>

            {myRequest ? (
              <StatusBanner
                tone="warning"
                icon={<Clock size={16} color={colors.warning} />}
                title="Request sent — waiting for approval"
                body="You'll be notified when the host replies."
              />
            ) : null}
            {isMember && ride.rideStatus === "in_progress" ? (
              <StatusBanner
                tone="success"
                icon={<ShieldCheck size={16} color={colors.success} />}
                title="Ride is in progress"
                body="Track the ride live and stay in touch over chat."
              />
            ) : null}

            {isHost && pendingRequests.length > 0 ? (
              <View style={[styles.card]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Users size={16} color={colors.primary} />
                  <AppText size="sm" weight={600}>
                    Join requests ({pendingRequests.length})
                  </AppText>
                </View>
                <View style={{ gap: 12 }}>
                  {pendingRequests.map((r) => (
                    <View
                      key={r.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        padding: 10,
                      }}
                    >
                      <Avatar
                        size={36}
                        src={r.passengerAvatarUrl ?? undefined}
                        fallback={(r.passengerDisplayName ?? "C")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText size="xs" weight={600} numberOfLines={1}>
                          {r.passengerDisplayName ?? "Covian"}
                        </AppText>
                        {r.passengerRating != null ? (
                          <AppText size="xs" color={colors.mutedForeground}>
                            {r.passengerRating.toFixed(1)} ★ · {r.passengerReliability ?? "—"}% reliable
                          </AppText>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <IconButton
                          accessibilityLabel="Approve request"
                          disabled={busy}
                          onPress={() =>
                            act(() => hostRespondToRequest(r.id, true), "Request approved — seat confirmed.")
                          }
                          style={{ height: 34, width: 34, borderRadius: radius.md, backgroundColor: colors.successSoft }}
                        >
                          <Check size={16} color={colors.success} />
                        </IconButton>
                        <IconButton
                          accessibilityLabel="Reject request"
                          disabled={busy}
                          onPress={() =>
                            act(() => hostRespondToRequest(r.id, false), "Request declined.")
                          }
                          style={{ height: 34, width: 34, borderRadius: radius.md, backgroundColor: colors.destructiveSoft }}
                        >
                          <X size={16} color={colors.destructive} />
                        </IconButton>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={[styles.card]}>
              <AppText size="sm" weight={600} style={{ marginBottom: 12 }}>
                Ride timeline
              </AppText>
              <RideTimeline events={timeline} current={currentStep(ride.rideStatus)} />
            </View>

            <StatusBanner
              tone="info"
              icon={<ShieldCheck size={16} color={colors.primary} />}
              title="Safety information"
              body="Every Covian is ID verified. Share your live ride with an emergency contact and use SOS any time."
            />
          </View>
        </ScrollView>
      </Screen>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: "row",
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: `${colors.card}F2`,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        {isMember ? (
          <IconButton
            accessibilityLabel="Open ride chat"
            onPress={() => router.push(`/chat?rideId=${ride.id}`)}
            style={{ height: 52, width: 52, borderRadius: radius.lg, backgroundColor: colors.secondary }}
          >
            <MessageCircle size={20} color={colors.secondaryForeground} />
          </IconButton>
        ) : null}
        {isHost ? (
          <>
            {ride.rideStatus === "published" || ride.rideStatus === "full" ? (
              <>
                <Button
                  variant="secondary"
                  style={{ flex: 1, height: 52, borderRadius: radius.lg }}
                  onPress={() => setConfirmCancel(true)}
                  disabled={busy}
                >
                  <AppText size="sm" weight={600} color={colors.destructive}>
                    Cancel ride
                  </AppText>
                </Button>
                <Button
                  style={{ flex: 1, height: 52, borderRadius: radius.lg }}
                  onPress={() => act(() => startRide(ride.id), "Ride started — be safe!")}
                  disabled={busy}
                >
                  <AppText size="base" weight={600} color={colors.primaryForeground}>
                    Start ride
                  </AppText>
                </Button>
              </>
            ) : ride.rideStatus === "in_progress" ? (
              <Button
                style={{ flex: 1, height: 52, borderRadius: radius.lg }}
                onPress={() => act(() => completeRide(ride.id), "Ride completed — you can rate your Covians.")}
                disabled={busy}
              >
                <AppText size="base" weight={600} color={colors.primaryForeground}>
                  Complete ride
                </AppText>
              </Button>
            ) : null}
          </>
        ) : canRequest ? (
          <Button
            style={{ flex: 1, height: 52, borderRadius: radius.lg }}
            onPress={() =>
              act(() => requestToJoin(ride.id), "Request sent — we'll notify you when the host replies.")
            }
            disabled={busy}
          >
            <AppText size="base" weight={600} color={colors.primaryForeground}>
              Request a seat · {fare}
            </AppText>
          </Button>
        ) : isMember ? (
          <Button
            variant="secondary"
            style={{ flex: 1, height: 52, borderRadius: radius.lg }}
            onPress={() => (ride.rideStatus === "in_progress" ? router.push("/live") : setConfirmLeave(true))}
            disabled={busy}
          >
            <AppText size="sm" weight={600} color={colors.secondaryForeground}>
              {ride.rideStatus === "in_progress" ? "Track this ride" : "Leave ride"}
            </AppText>
          </Button>
        ) : myRequest ? (
          <Button
            variant="secondary"
            style={{ flex: 1, height: 52, borderRadius: radius.lg }}
            onPress={() => act(() => cancelRideRequest(myRequest.id), "Request withdrawn.")}
            disabled={busy}
          >
            <AppText size="sm" weight={600} color={colors.secondaryForeground}>
              Withdraw request
            </AppText>
          </Button>
        ) : null}
      </View>

      <Dialog
        visible={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this ride?"
      >
        <AppText size="sm" color={colors.mutedForeground}>
          Joined Covians will be notified. Cancelling close to departure hurts your reliability score.
        </AppText>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <Button
            variant="secondary"
            style={{ flex: 1, height: 46, borderRadius: radius.lg }}
            onPress={() => setConfirmCancel(false)}
          >
            <AppText size="sm" weight={600} color={colors.secondaryForeground}>
              Keep ride
            </AppText>
          </Button>
          <Button
            style={{ flex: 1, height: 46, borderRadius: radius.lg }}
            onPress={() => {
              setConfirmCancel(false);
              act(() => cancelRide(ride.id), "Ride cancelled — Covians have been notified.");
            }}
            disabled={busy}
          >
            <AppText size="sm" weight={600} color={colors.primaryForeground}>
              Cancel ride
            </AppText>
          </Button>
        </View>
      </Dialog>

      <Dialog visible={confirmLeave} onClose={() => setConfirmLeave(false)} title="Leave this ride?">
        <AppText size="sm" color={colors.mutedForeground}>
          Your seat is freed for another Covian. Leaving a ride hurts your reliability score.
        </AppText>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <Button
            variant="secondary"
            style={{ flex: 1, height: 46, borderRadius: radius.lg }}
            onPress={() => setConfirmLeave(false)}
          >
            <AppText size="sm" weight={600} color={colors.secondaryForeground}>
              Stay
            </AppText>
          </Button>
          <Button
            style={{ flex: 1, height: 46, borderRadius: radius.lg }}
            onPress={() => {
              setConfirmLeave(false);
              act(() => leaveRide(ride.id), "You left the ride.");
            }}
            disabled={busy}
          >
            <AppText size="sm" weight={600} color={colors.primaryForeground}>
              Leave ride
            </AppText>
          </Button>
        </View>
      </Dialog>
    </PhoneShell>
  );
}

const styles = {
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    ...shadows.soft,
  },
};
