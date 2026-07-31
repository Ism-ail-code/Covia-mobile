import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/theme";

type Props = {
  value: boolean;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** iOS-style toggle matching the web Switch (h-5 w-9, primary when on). */
export function Switch({ value, onValueChange, disabled, style }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={[
        {
          height: 20,
          width: 36,
          borderRadius: 999,
          padding: 2,
          backgroundColor: value ? colors.primary : colors.input,
          justifyContent: value ? "flex-end" : "flex-start",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          height: 16,
          width: 16,
          borderRadius: 999,
          backgroundColor: colors.card,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}
