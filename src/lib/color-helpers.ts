/**
 * Covia Color Helpers — color utility functions.
 */

/** Convert hex color to RGBA. */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Check if a hex color is light or dark. */
export function isLightColor(hex: string): boolean {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/** Get a contrasting text color (black or white) for a background. */
export function getContrastTextColor(bgHex: string): string {
  return isLightColor(bgHex) ? "#000000" : "#ffffff";
}

/** Lighten a hex color by a percentage (0-100). */
export function lightenColor(hex: string, percent: number): string {
  const cleaned = hex.replace("#", "");
  const r = Math.min(255, parseInt(cleaned.substring(0, 2), 16) + Math.round(255 * (percent / 100)));
  const g = Math.min(255, parseInt(cleaned.substring(2, 4), 16) + Math.round(255 * (percent / 100)));
  const b = Math.min(255, parseInt(cleaned.substring(4, 6), 16) + Math.round(255 * (percent / 100)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Darken a hex color by a percentage (0-100). */
export function darkenColor(hex: string, percent: number): string {
  const cleaned = hex.replace("#", "");
  const r = Math.max(0, parseInt(cleaned.substring(0, 2), 16) - Math.round(255 * (percent / 100)));
  const g = Math.max(0, parseInt(cleaned.substring(2, 4), 16) - Math.round(255 * (percent / 100)));
  const b = Math.max(0, parseInt(cleaned.substring(4, 6), 16) - Math.round(255 * (percent / 100)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
