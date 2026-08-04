import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, sans } from "@/theme";
import { AppText } from "./AppText";

type Props = {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<object>;
};

/** Pill filter chip, mirrors the web Chip (rounded-full, primary when active). */
export function Chip({ children, active, onPress, style, textStyle }: Props) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      {...(onPress ? { accessibilityRole: "button" as const, accessibilityState: { selected: active ?? false } } : {})}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          borderWidth: 1,
          borderRadius: radius.full,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: active ? colors.primarySoft : colors.card,
          borderColor: active ? colors.primary : colors.border,
          opacity: onPress ? 1 : undefined,
        },
        style,
      ]}
    >
      {typeof children === "string" ? (
        <AppText
          size="xs"
          weight={500}
          color={active ? colors.primary : colors.mutedForeground}
          style={textStyle}
        >
          {children}
        </AppText>
      ) : (
        children
      )}
    </Comp>
  );
}
