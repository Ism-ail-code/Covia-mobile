import { View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme";
import { Label } from "./Label";
import { Input, type InputProps } from "./Input";
type Props = InputProps & {
  label: string;
  /** Icon rendered inside the field's left edge (web absolute icon). */
  icon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Label + iconised input used across auth & create-ride forms. */
export function FormField({ label, icon, containerStyle, style, ...rest }: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <Input
        icon={icon}
        containerStyle={[{ minHeight: 48 }, containerStyle]}
        style={[
          {
            height: 48,
            borderRadius: radius.lg,
            paddingLeft: 40,
            backgroundColor: colors.background,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}
