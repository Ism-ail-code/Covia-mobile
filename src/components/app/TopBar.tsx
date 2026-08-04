import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors, radius, sans } from "@/theme";
import { AppText } from "@/components/ui/AppText";

type Props = {
  title: string;
  subtitle?: string;
  /** Renders a circular back button. Defaults to popping the stack. */
  back?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Sticky header with optional back button and action slot (web TopBar). */
export function TopBar({ title, subtitle, back, onBack, action, style }: Props) {
  const router = useRouter();
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: `${colors.border}99`,
          backgroundColor: `${colors.background}F2`,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        style,
      ]}
    >
      {back ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            {
              height: 44,
              width: 44,
              borderRadius: radius.full,
              backgroundColor: colors.secondary,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <ChevronLeft size={20} color={colors.secondaryForeground} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText
          size="lg"
          family="display"
          weight={700}
          numberOfLines={1}
          style={{ letterSpacing: -0.3 }}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}
