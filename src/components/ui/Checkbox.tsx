import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Check } from "lucide-react-native";
import { colors } from "@/theme";

type Props = {
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Square checkbox mirroring the web Checkbox (16px, primary when checked). */
export function Checkbox({ value = false, onValueChange, disabled, style }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={({ pressed }) => [
        {
          height: 16,
          width: 16,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: value ? colors.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {value ? <Check size={12} color={colors.primaryForeground} strokeWidth={3} /> : null}
    </Pressable>
  );
}
