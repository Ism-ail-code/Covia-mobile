import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Navigation, MapPin } from "lucide-react-native";
import { colors, radius, sans } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PulseDot } from "@/components/ui/animations";

export function RouteLine({
  pickup,
  destination,
  landmark,
  compact = false,
  style,
}: {
  pickup: string;
  destination: string;
  landmark?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const main = compact ? 12 : 14;
  return (
    <View style={[{ flexDirection: "row", gap: 12 }, style]}>
      <View style={{ alignItems: "center", paddingTop: 2 }}>
        <View
          style={{
            height: 10,
            width: 10,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: colors.background,
          }}
        />
        <View style={{ width: 2, flex: 1, minHeight: 24, marginVertical: 4 }}>
          <LinearGradient
            colors={[`${colors.primary}80`, `${colors.success}80`]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
          />
        </View>
        <View
          style={{
            height: 10,
            width: 10,
            borderRadius: 3,
            backgroundColor: colors.success,
          }}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
        <View style={{ minWidth: 0 }}>
          <AppText
            size={compact ? "xs" : "sm"}
            weight={500}
            numberOfLines={1}
            style={{ lineHeight: compact ? 16 : 20 }}
          >
            {pickup}
          </AppText>
          {landmark ? (
            <AppText size="xs" color={colors.mutedForeground} numberOfLines={1} style={{ marginTop: 2 }}>
              {landmark}
            </AppText>
          ) : null}
        </View>
        <AppText
          size={compact ? "xs" : "sm"}
          weight={500}
          numberOfLines={1}
          style={{ lineHeight: compact ? 16 : 20 }}
        >
          {destination}
        </AppText>
      </View>
    </View>
  );
}

/** Stylised route map placeholder (grid + SVG route + overlays). */
export function MapPlaceholder({
  style,
  eta,
  label = "Live route",
  height,
}: {
  style?: StyleProp<ViewStyle>;
  eta?: string;
  label?: string;
  height?: number;
}) {
  return (
    <View style={[{ overflow: "hidden", backgroundColor: colors.surface, height: height ?? 208 }, style]}>
      <MapGrid />
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 260">
        <Path
          d="M40 220 C 110 200, 120 130, 190 120 S 300 90, 360 40"
          stroke={colors.primary}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          opacity={0.9}
        />
        <Path
          d="M40 220 C 110 200, 120 130, 190 120 S 300 90, 360 40"
          stroke={colors.background}
          strokeWidth={2}
          strokeDasharray="10 12"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <View style={{ position: "absolute", left: 24, bottom: 32 }}>
        <PulseDot size={18} color={colors.primary} ringDistance={22}>
          <View
            style={{
              height: 18,
              width: 18,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
            }}
          >
            <View style={{ height: 7, width: 7, borderRadius: 999, backgroundColor: colors.primaryForeground }} />
          </View>
        </PulseDot>
      </View>

      <View
        style={{
          position: "absolute",
          right: 32,
          top: 24,
          height: 24,
          width: 24,
          borderRadius: 999,
          backgroundColor: colors.success,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MapPin size={14} color={colors.successForeground} strokeWidth={2.5} />
      </View>

      <View
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          borderRadius: radius.full,
          backgroundColor: `${colors.card}F0`,
          paddingHorizontal: 12,
          paddingVertical: 6,
          shadowColor: colors.foreground,
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <Navigation size={14} color={colors.primary} strokeWidth={2.5} />
        <AppText size="xs" weight={600}>
          {label}
        </AppText>
      </View>

      {eta ? (
        <View
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            borderRadius: radius.lg,
            backgroundColor: `${colors.card}F2`,
            paddingHorizontal: 12,
            paddingVertical: 8,
            alignItems: "flex-end",
            shadowColor: colors.foreground,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <AppText
            size="xs"
            color={colors.mutedForeground}
            style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}
          >
            ETA
          </AppText>
          <AppText size="base" family="display" weight={700}>
            {eta}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function MapGrid() {
  const lines = Array.from({ length: 16 });
  return (
    <View style={StyleSheet.absoluteFill}>
      {lines.map((_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: "absolute",
            left: i * 28,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: `${colors.primary}14`,
          }}
        />
      ))}
      {lines.map((_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: "absolute",
            top: i * 28,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: `${colors.primary}14`,
          }}
        />
      ))}
    </View>
  );
}
