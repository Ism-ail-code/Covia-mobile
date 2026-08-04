/**
 * Covia Dimensions — screen size detection and responsive helpers.
 * Provides consistent responsive behavior across devices.
 */

import { Dimensions, ScaledSize } from "react-native";

/** Get the current screen dimensions. */
export function getScreenDimensions(): ScaledSize {
  return Dimensions.get("window");
}

/** Get the screen width. */
export function getScreenWidth(): number {
  return Dimensions.get("window").width;
}

/** Get the screen height. */
export function getScreenHeight(): number {
  return Dimensions.get("window").height;
}

/** Check if the device is in landscape mode. */
export function isLandscape(): boolean {
  const { width, height } = Dimensions.get("window");
  return width > height;
}

/** Responsive breakpoint check. */
export function isSmallScreen(): boolean {
  return getScreenWidth() < 375;
}

export function isMediumScreen(): boolean {
  const w = getScreenWidth();
  return w >= 375 && w < 768;
}

export function isLargeScreen(): boolean {
  return getScreenWidth() >= 768;
}

/** Calculate responsive size based on screen width. */
export function responsiveSize(
  small: number,
  medium: number,
  large: number,
): number {
  if (isSmallScreen()) return small;
  if (isMediumScreen()) return medium;
  return large;
}

/** Scale a value based on screen width (base: 375 iPhone SE). */
export function scaleWidth(value: number): number {
  const screenWidth = getScreenWidth();
  return (value / 375) * screenWidth;
}

/** Scale a value based on screen height (base: 812 iPhone X). */
export function scaleHeight(value: number): number {
  const screenHeight = getScreenHeight();
  return (value / 812) * screenHeight;
}
