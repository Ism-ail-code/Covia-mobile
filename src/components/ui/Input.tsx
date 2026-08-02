import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radius, sans } from "@/theme";

type Props = TextInputProps & {
  /** Wraps the input in a relative container when an icon is passed. */
  icon?: React.ReactNode;
  /** Slot for a right-side icon/action (e.g. password reveal). */
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Covia text field — rounded-2xl by default, mirrors the web Input. */
export type InputProps = Props;

export function Input({ icon, rightIcon, containerStyle, style, ...rest }: Props) {
  const input = (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      style={[
        {
          fontFamily: sans(400),
          fontSize: 14,
          lineHeight: 20,
          color: colors.foreground,
          height: 36,
          borderWidth: 1,
          borderColor: colors.input,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: "transparent",
        },
        style,
      ]}
      {...rest}
    />
  );
  if (!icon && !rightIcon) return input;
  return (
    <View style={[styles.container, containerStyle]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      {input}
      {rightIcon ? <View style={styles.rightWrap}>{rightIcon}</View> : null}
    </View>
  );
}

const styles = {
  container: { position: "relative" as const, justifyContent: "center" as const },
  iconWrap: {
    position: "absolute" as const,
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center" as const,
    zIndex: 1,
  },
  rightWrap: {
    position: "absolute" as const,
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center" as const,
    zIndex: 1,
  },
};
