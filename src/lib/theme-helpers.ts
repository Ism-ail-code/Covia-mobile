/**
 * Covia Theme Helpers — theme utility functions.
 * Works with the existing color system to provide additional utilities.
 */

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { radius } from "../theme/spacing";

/** Get a color from the theme by semantic name. */
export function getThemeColor(name: keyof typeof colors): string {
  return colors[name];
}

/** Get a spacing value by scale key. */
export function getSpacing(value: keyof typeof spacing): number {
  return spacing[value];
}

/** Get a border radius value by scale key. */
export function getRadius(value: keyof typeof radius): number {
  return radius[value];
}

/** Generate a consistent shadow style for cards. */
export function getCardShadow() {
  return {
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  };
}

/** Generate a consistent shadow style for floating elements. */
export function getFloatingShadow() {
  return {
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  };
}

/** Get the platform-specific border width. */
export function getInputBorderWidth(): number {
  return 1;
}

/** Get the focus ring style for inputs. */
export function getFocusRingStyle() {
  return {
    borderColor: colors.ring,
    borderWidth: 2,
  };
}
