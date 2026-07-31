import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Clock, Users, Sparkles } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { money, type Ride } from "@/data/mock";
import { Avatar } from "@/components/ui/Avatar";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { Shimmer } from "@/components/ui/animations";
import { VerificationBadges, Rating, ReliabilityPill } from "./Badges";
import { RouteLine } from "./RouteLine";

export function RideCard({
  ride,
  style,
  onPress,
}: {
  ride: Ride;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => router.push(`/ride/${ride.id}`))}
      style={({ pressed }) => [
        {
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 16,
          ...shadows.soft,
          opacity: pressed ? 0.96 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar
          src={ride.host.photo}
          fallback={ride.host.initials}
          size={44}
          ring={{ color: colors.primarySoft }}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AppText size="sm" weight={600} numberOfLines={1} style={{ flexShrink: 1 }}>
              {ride.host.name}
            </AppText>
            <Rating value={ride.host.rating} />
          </View>
          <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <VerificationBadges items={ride.host.verifications.slice(0, 2)} compact />
            <ReliabilityPill value={ride.host.reliability} />
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <AppText size="base" family="display" weight={700} style={{ lineHeight: 20 }}>
            {money(ride.fare)}
          </AppText>
          <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 10, marginTop: 4 }}>
            per seat
          </AppText>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

      <RouteLine pickup={ride.pickup} destination={ride.destination} landmark={ride.pickupLandmark} />

      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 16,
          rowGap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Clock size={14} color={colors.mutedForeground} />
          <AppText size="xs" color={colors.mutedForeground}>
            {ride.date} · {ride.time}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Users size={14} color={colors.mutedForeground} />
          <AppText size="xs" color={colors.mutedForeground}>
            {ride.seatsLeft > 0 ? `${ride.seatsLeft} of ${ride.seatsTotal} seats left` : "Full"}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Sparkles size={14} color={colors.mutedForeground} />
          <AppText size="xs" color={colors.mutedForeground}>
            {ride.fareType} · {ride.service}
          </AppText>
        </View>
      </View>

      {ride.tags.length ? (
        <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {ride.tags.map((t) => (
            <Chip key={t} style={{ paddingVertical: 4 }}>
              {t}
            </Chip>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export function RideCardSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ borderRadius: radius["2xl"], borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 16 }, style]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Shimmer width={44} height={44} />
        <View style={{ flex: 1, gap: 8 }}>
          <Shimmer width={128} height={12} />
          <Shimmer width={96} height={12} />
        </View>
      </View>
      <View style={{ marginTop: 16, gap: 8 }}>
        <Shimmer width="100%" height={12} radius={6} />
        <Shimmer width="66%" height={12} radius={6} />
      </View>
    </View>
  );
}
