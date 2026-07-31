import SliderBase, { type SliderProps } from "@react-native-community/slider";
import { colors } from "@/theme";

/** Styled slider matching the web Slider (primary/20 track, primary fill). */
export function Slider({ minimumTrackTintColor, maximumTrackTintColor, thumbTintColor, ...rest }: SliderProps) {
  return (
    <SliderBase
      minimumTrackTintColor={minimumTrackTintColor ?? colors.primary}
      maximumTrackTintColor={maximumTrackTintColor ?? `${colors.primary}33`}
      thumbTintColor={thumbTintColor ?? colors.card}
      {...rest}
    />
  );
}
