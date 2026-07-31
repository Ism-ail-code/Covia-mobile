import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Users, ShieldCheck, MessageCircle, Clock } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { MapPlaceholder, RouteLine } from "@/components/app/RouteLine";
import { RideTimeline } from "@/components/app/RideTimeline";
import { VerificationBadges, Rating, ReliabilityPill, StatBlock } from "@/components/app/Badges";
import { Chip } from "@/components/ui/Chip";
import { StatusBanner } from "@/components/app/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { getRide, money, timelineSteps } from "@/data/mock";

type Join = "idle" | "pending" | "approved" | "rejected";

export default function RideDetails() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const toast = useToast();
  const ride = getRide(rideId);
  const [join, setJoin] = useState<Join>("idle");

  return (
    <PhoneShell>
      <TopBar title="Ride details" subtitle={`${ride.date} · ${ride.time}`} back onBack={() => router.navigate("/explore")} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 128, gap: 16 }}>
          <MapPlaceholder height={208} eta="24 min" label={`${ride.distanceKm} km route`} />

          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <View style={[styles.card]}>
              <RouteLine
                pickup={ride.pickup}
                destination={ride.destination}
                landmark={ride.pickupLandmark}
              />
              <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
                <StatBlock label="Departs" value={ride.time} />
                <StatBlock label="Seats left" value={`${ride.seatsLeft}`} />
                <StatBlock label="Per seat" value={money(ride.fare)} />
              </View>
              <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {ride.tags.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
                <Chip>{ride.fareType}</Chip>
                <Chip>Book on {ride.service}</Chip>
              </View>
            </View>

            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
              <Avatar size={48} src={ride.host.photo} name={ride.host.name} ring="primarySoft" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <AppText size="sm" weight={600} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {ride.host.name}
                  </AppText>
                  <Rating value={ride.host.rating} count={ride.host.rides} />
                </View>
                <View style={{ marginTop: 4, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  <VerificationBadges items={ride.host.verifications} compact />
                  <ReliabilityPill value={ride.host.reliability} />
                </View>
              </View>
            </View>

            <View style={[styles.card]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Users size={16} color={colors.primary} />
                <AppText size="sm" weight={600}>
                  Companions ({ride.passengers.length + 1})
                </AppText>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {[ride.host, ...ride.passengers].map((p) => (
                  <View key={p.id} style={{ width: 64, alignItems: "center", gap: 4 }}>
                    <Avatar size={44} src={p.photo} name={p.name} />
                    <AppText size="xs" color={colors.mutedForeground} numberOfLines={1} style={{ fontSize: 10 }}>
                      {p.name.split(" ")[0]}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>

            {join === "pending" ? (
              <StatusBanner
                tone="warning"
                icon={<Clock size={16} color={colors.warning} />}
                title="Request sent — waiting for approval"
                body="Sara usually responds within 6 minutes."
              />
            ) : null}
            {join === "approved" ? (
              <StatusBanner
                tone="success"
                icon={<ShieldCheck size={16} color={colors.success} />}
                title="You're in! Seat confirmed"
                body="Head to the pickup landmark 5 minutes before departure."
              />
            ) : null}
            {join === "rejected" ? (
              <StatusBanner
                tone="danger"
                title="Request declined"
                body="This ride filled up. Browse similar routes leaving around the same time."
              />
            ) : null}

            <View style={[styles.card]}>
              <AppText size="sm" weight={600} style={{ marginBottom: 12 }}>
                Ride timeline
              </AppText>
              <RideTimeline steps={timelineSteps.slice(0, 6)} current={join === "approved" ? 3 : 2} />
            </View>

            <StatusBanner
              tone="info"
              icon={<ShieldCheck size={16} color={colors.primary} />}
              title="Safety information"
              body="Every companion is ID verified. Share your live ride with an emergency contact and use SOS any time."
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
        <IconButton
          accessibilityLabel="Open ride chat"
          onPress={() => router.push("/chat")}
          style={{ height: 52, width: 52, borderRadius: radius.lg, backgroundColor: colors.secondary }}
        >
          <MessageCircle size={20} color={colors.secondaryForeground} />
        </IconButton>
        {join === "idle" ? (
          <Button
            style={{ flex: 1, height: 52, borderRadius: radius.lg }}
            onPress={() => {
              setJoin("pending");
              toast.success("Request sent", { description: "We'll notify you when the host replies." });
              setTimeout(() => setJoin("approved"), 2200);
            }}
          >
            <AppText size="base" weight={600} color={colors.primaryForeground}>
              Request a seat · {money(ride.fare)}
            </AppText>
          </Button>
        ) : (
          <Button style={{ flex: 1, height: 52, borderRadius: radius.lg }} onPress={() => router.push("/live")}>
            <AppText size="base" weight={600} color={colors.primaryForeground}>
              Track this ride
            </AppText>
          </Button>
        )}
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
