import { TextInput, type TextInputProps, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, sans } from "@/theme";

type Props = TextInputProps & {
  style?: StyleProp<ViewStyle>;
};

/** Multi-line field, mirrors the web Textarea (rounded-2xl via className). */
export function Textarea({ style, ...rest }: Props) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      placeholderTextColor={colors.mutedForeground}
      style={[
        {
          fontFamily: sans(400),
          fontSize: 14,
          lineHeight: 20,
          color: colors.foreground,
          minHeight: 60,
          borderWidth: 1,
          borderColor: colors.input,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: "transparent",
        },
        style,
      ]}
      {...rest}
    />
  );
}
