/**
 * Typography scale. Mirrors the web app: Plus Jakarta Sans for display
 * (headings), Inter for body text. Letter-spacing -0.02em on display type.
 */

import type { TextStyle } from "react-native";

export const fontFamily = {
  display: {
    500: "PlusJakartaSans_500Medium",
    600: "PlusJakartaSans_600SemiBold",
    700: "PlusJakartaSans_700Bold",
    800: "PlusJakartaSans_800ExtraBold",
  },
  body: {
    400: "Inter_400Regular",
    500: "Inter_500Medium",
    600: "Inter_600SemiBold",
    700: "Inter_700Bold",
  },
} as const;

export type FontWeight = 400 | 500 | 600 | 700 | 800;

export const display = (weight: Exclude<FontWeight, 400> = 700) =>
  fontFamily.display[weight];
export const sans = (weight: Exclude<FontWeight, 800> = 400) =>
  fontFamily.body[weight];

export const size = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "28": 28,
  "4xl": 36,
} as const;

export type TextSize = keyof typeof size;

export const line = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  "2xl": 32,
  "28": 32,
  "4xl": 40,
} as const;

/** Base style shared by every heading (display family, -0.02em tracking). */
export const displayBase: TextStyle = {
  fontFamily: display(700),
  letterSpacing: -0.3,
};
