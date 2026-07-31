/**
 * Elevation shadows. Ported from the web theme:
 *  - soft:    0 1px 2px   rgba · 0 8px 24px -12px rgba
 *  - lifted:  0 2px 4px   rgba · 0 18px 40px -16px rgba
 *  - nav:     0 -8px 30px -18px rgba (top edge)
 * The base colour is the theme's blue-tinted neutral (oklch 0.45 0.09 250).
 */

import type { ViewStyle } from "react-native";

const shadowColor = "rgba(42, 88, 133, 1)";

export const shadows: Record<"soft" | "lifted" | "nav", ViewStyle> = {
  soft: {
    shadowColor,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lifted: {
    shadowColor,
    shadowOpacity: 0.26,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },
  nav: {
    shadowColor: "rgba(20, 60, 98, 1)",
    shadowOpacity: 0.45,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
};
