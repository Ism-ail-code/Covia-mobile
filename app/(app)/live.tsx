import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle, ShieldAlert, Navigation, RefreshCw } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { MapPlaceholder } from "@/components/app/RouteLine";
import { RideTimeline } from "@/components/app/RideTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/app/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { getRideHistory, getRideParticipants, getRideTimeline } from "@/services/rides";
import type { RideHistoryEntry, RideParticipant, RideTimelineEvent } from "@/types/ride";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });

export default function LiveRide() {
  const router = useRouter();
  const toast = useToast();
  const [entry, setEntry] = useState<RideHistoryEntry | null>(null);
  const [participants, setParticipants] = useState<RideParticipant[]>([]);
  const [timeline, setTimeline] = useState<RideTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const history = await getRideHistory(null, null, 1, 20);
        const active = history.entries.find((e) => e.rideStatus === "in_progress");
        if (cancelled) return;
        if (!active) {
          setError("You don't have a ride in progress right now.");
          return;
        }
        setEntry(active);
        const [members, events] = await Promise.all([
          getRideParticipants(active.rideId).catch(() => [] as RideParticipant[]),
          getRideTimeline(active.rideId).catch(() => [] as RideTimelineEvent[]),
        ]);
        if (cancelled) return;
        setParticipants(members);
        setTimeline(events);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Couldn't load the live ride.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <PhoneShell>
        <TopBar title="Live ride" back onBack={() => router.back()} />
        <Screen>
          <View style={{ padding: 40, alignItems: "center", gap: 8 }}>
            <AppText size="sm" color={colors.mutedForeground}>
              Finding your active ride…
            </AppText>
          </View>
        </Screen>
      </PhoneShell>
    );
  }

  if (error || !entry) {
    return (
      <PhoneShell>
        <TopBar title="Live ride" back onBack={() => router.back()} />
        <Screen>
          <EmptyState
            icon={<RefreshCw size={28} color={colors.warning} />}
            title="No live ride"
            body={error ?? "Start or join a ride to see live tracking here."}
            action={
              <Button block style={{ height: 48, borderRadius: 16 }} onPress={() => router.push("/explore")}>
                <AppText size="sm" weight={600} color={colors.primaryForeground}>
                  Browse rides
                </AppText>
              </Button>
            }
          />
        </Screen>
      </PhoneShell>
    );
  }

  const onBoard = participants.filter((p) => !p.leftAt);
  const progressed = Math.min(
    100,
    Math.round((timeline.length / Math.max(9, timeline.length + 3)) * 100),
  );

  return (
    <PhoneShell>
      <TopBar title="Live ride" subtitle={entry.destination} back onBack={() => router.back()} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 112, gap: 16 }}>
          <MapPlaceholder height={256} eta="12 min" label="En route" />

          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <View style={[styles.card]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <AppText size="sm" weight={600}>
                  Ride progress
                </AppText>
                <AppText size="xs" color={colors.mutedForeground}>
                  {timeline.length} events so far
                </AppText>
              </View>
              <Progress value={progressed} style={{ marginTop: 12, height: 8 }} />
              <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 8 }}>
                {entry.origin} → {entry.destination} · departs {formatTime(entry.departureTime)}
              </AppText>
            </View>

            <View style={[styles.card]}>
              <AppText size="sm" weight={600} style={{ marginBottom: 12 }}>
                Covians on board ({onBoard.length})
              </AppText>
              {onBoard.length ? (
                <View style={{ gap: 12 }}>
                  {onBoard.map((p) => (
                    <View key={p.userId} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Avatar
                        size={36}
                        src={p.avatarUrl ?? undefined}
                        fallback={(p.displayName ?? "C")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      />
                      <AppText size="sm" numberOfLines={1} style={{ flex: 1 }}>
                        {p.displayName ?? "Covian"}
                        {p.role === "Host" ? " (Host)" : ""}
                      </AppText>
                      <AppText size="xs" weight={600} color={colors.success}>
                        On board
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : (
                <AppText size="xs" color={colors.mutedForeground}>
                  No one else has joined.
                </AppText>
              )}
            </View>

            <View style={[styles.card]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Navigation size={16} color={colors.primary} />
                <AppText size="sm" weight={600}>
                  Timeline
                </AppText>
              </View>
              <RideTimeline events={timeline} current={timeline.length} />
            </View>
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
        <Button
          variant="secondary"
          style={{ flex: 1, height: 52, borderRadius: radius.lg }}
          onPress={() => router.push(`/chat?rideId=${entry.rideId}`)}
        >
          <MessageCircle size={16} color={colors.secondaryForeground} />
          <AppText size="sm" weight={600} color={colors.secondaryForeground}>
            Chat
          </AppText>
        </Button>
        <Button
          variant="destructive"
          style={{ flex: 1, height: 52, borderRadius: radius.lg }}
          onPress={() => router.push("/safety")}
        >
          <ShieldAlert size={16} color={colors.destructiveForeground} />
          <AppText size="sm" weight={600} color={colors.destructiveForeground}>
            SOS
          </AppText>
        </Button>
      </View>
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
