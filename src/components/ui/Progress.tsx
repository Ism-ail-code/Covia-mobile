import { View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/theme";

type Props = {
  value?: number;
  /** Web h-1.5 → 6px track. */
  trackHeight?: number;
  style?: StyleProp<ViewStyle>;
};

/** Linear progress bar, mirrors the web Progress (primary on primary/20). */
export function Progress({ value = 0, trackHeight = 6, style }: Props) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityState={{ busy: value < 100 }}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      style={[
        {
          height: trackHeight,
          width: "100%",
          borderRadius: 999,
          backgroundColor: `${colors.primary}33`,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value))}%`,
          borderRadius: 999,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}
