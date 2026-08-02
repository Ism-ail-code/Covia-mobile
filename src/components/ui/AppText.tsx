import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, sans, display, size, line, displayBase, type TextSize } from "@/theme";

type Props = TextProps & {
  size?: TextSize;
  family?: "body" | "display";
  weight?: 400 | 500 | 600 | 700 | 800;
  color?: string;
  /** tracking in px (web used -0.02em). */
  tracking?: number;
  /** Overrides display weight resolution: e.g. weight="600" on display. */
};

const familyFor = (family: "body" | "display", weight: number) =>
  family === "display"
    ? display((Math.max(500, weight) as 500 | 600 | 700 | 800) || 700)
    : sans((Math.min(700, weight) as 400 | 500 | 600 | 700) || 400);

/** App text primitive backed by the Covia design tokens. */
export function AppText({
  size: sz = "sm",
  family = "body",
  weight = 400,
  color = colors.foreground,
  tracking,
  style,
  ...rest
}: Props) {
  const textStyle: TextStyle = {
    fontFamily: familyFor(family, weight),
    fontSize: size[sz],
    lineHeight: line[sz],
    color,
  };
  if (family === "display") Object.assign(textStyle, displayBase, { fontFamily: familyFor(family, weight) });
  if (tracking !== undefined) textStyle.letterSpacing = tracking;
  return <Text style={[textStyle, style]} {...rest} />;
}
