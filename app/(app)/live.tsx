import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle, ShieldAlert, Phone, Navigation } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { MapPlaceholder } from "@/components/app/RouteLine";
import { RideTimeline } from "@/components/app/RideTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";
import { rides, timelineSteps } from "@/data/mock";

export default function LiveRide() {
  const router = useRouter();
  const toast = useToast();
  const ride = rides[1];

  return (
    <PhoneShell>
      <TopBar title="Live ride" subtitle="Silver Corolla · booked on Uber" back />
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
                  3 of 5 stops
                </AppText>
              </View>
              <Progress value={62} style={{ marginTop: 12, height: 8 }} />
              <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 8 }}>
                Next stop: {ride.destination} · arriving 09:24
              </AppText>
            </View>

            <View style={[styles.card]}>
              <AppText size="sm" weight={600} style={{ marginBottom: 12 }}>
                Companions on board
              </AppText>
              <View style={{ gap: 12 }}>
                {[ride.host, ...ride.passengers].map((p, i) => (
                  <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Avatar size={36} src={p.photo} name={p.name} />
                    <AppText size="sm" numberOfLines={1} style={{ flex: 1 }}>
                      {p.name}
                    </AppText>
                    <AppText size="xs" weight={600} color={colors.success}>
                      {i === 2 ? "Next drop" : "On board"}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.card]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Navigation size={16} color={colors.primary} />
                <AppText size="sm" weight={600}>
                  Timeline
                </AppText>
              </View>
              <RideTimeline steps={timelineSteps} current={7} />
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
          onPress={() => router.push("/chat")}
        >
          <MessageCircle size={16} color={colors.secondaryForeground} />
          <AppText size="sm" weight={600} color={colors.secondaryForeground}>
            Chat
          </AppText>
        </Button>
        <Button
          variant="secondary"
          accessibilityLabel="Call host"
          style={{ height: 52, width: 52, borderRadius: radius.lg, paddingHorizontal: 0 }}
        >
          <Phone size={20} color={colors.secondaryForeground} />
        </Button>
        <Button
          variant="destructive"
          style={{ flex: 1, height: 52, borderRadius: radius.lg }}
          onPress={() => toast.error("SOS activated", { description: "Emergency contacts notified." })}
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
