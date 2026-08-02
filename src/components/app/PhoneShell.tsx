import { View, type StyleProp, type ViewStyle } from "react-native";
import { colors, phoneWidth, gutter } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { ScreenFade } from "@/components/ui/animations";

/** Centered phone canvas used by every Covia screen (web PhoneShell). */
export function PhoneShell({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={[
          {
            flex: 1,
            width: "100%",
            maxWidth: phoneWidth,
            alignSelf: "center",
            backgroundColor: colors.background,
          },
          padded && { paddingBottom: 0 },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/** Scrollable screen body with the web screen fade-in. */
export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScreenFade>
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </ScreenFade>
  );
}

export function SectionHeader({
  title,
  action,
  style,
}: {
  title: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          paddingHorizontal: gutter,
        },
        style,
      ]}
    >
      <AppText size="base" family="display" weight={700}>
        {title}
      </AppText>
      {action}
    </View>
  );
}
