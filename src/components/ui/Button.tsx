import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

type Props = PressableProps & {
  variant?: Variant;
  size?: Size;
  /** Fills the parent width (web `w-full`). */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<object>;
};

const variantStyles: Record<Variant, { bg?: string; border?: string; fg: string }> = {
  default: { bg: colors.primary, fg: colors.primaryForeground },
  destructive: { bg: colors.destructive, fg: colors.destructiveForeground },
  outline: { border: colors.input, fg: colors.foreground },
  secondary: { bg: colors.secondary, fg: colors.secondaryForeground },
  ghost: { fg: colors.foreground },
  link: { fg: colors.primary },
};

const sizeStyles: Record<Size, ViewStyle> = {
  default: { height: 44, paddingHorizontal: 16, borderRadius: radius.md },
  sm: { height: 36, paddingHorizontal: 12, borderRadius: radius.md },
  lg: { height: 48, paddingHorizontal: 32, borderRadius: radius.md },
  icon: { height: 44, width: 44, borderRadius: radius.md },
};

export function Button({
  variant = "default",
  size = "default",
  block,
  style,
  textStyle,
  children,
  disabled,
  ...rest
}: Props) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        {
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          flexDirection: "row",
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          opacity: disabled ? 0.5 : 1,
          alignSelf: "stretch",
        },
        s,
        block && { width: "100%" },
        style,
        pressed && { opacity: 0.85 },
      ]}
      {...rest}
    >
      {typeof children === "string" ? (
        <AppText
          size="sm"
          weight={variant === "link" ? 600 : 500}
          color={v.fg}
          style={textStyle}
        >
          {children}
        </AppText>
      ) : (
        children
      )}
    </Pressable>
  );
}

/** Round icon affordance used in top bars and bottom action rows. */
export function IconButton({
  variant = "secondary",
  size = 44,
  radius: r = radius.full,
  style,
  children,
  ...rest
}: PressableProps & {
  variant?: Variant;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = variantStyles[variant];
  return (
    <Pressable
      style={({ pressed }) => [
        {
          height: size,
          width: size,
          borderRadius: r,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: v.bg,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
