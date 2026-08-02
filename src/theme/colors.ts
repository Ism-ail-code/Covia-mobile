/**
 * Covia design system — trust, safety, simplicity.
 * Light-first. Premium blue + green accents. Soft surfaces, rounded corners.
 * Ported 1:1 from the web app's Tailwind theme (styles.css).
 */

export const colors = {
  background: "#fcfdff",
  foreground: "#101926",
  surface: "#f3f6fa",
  card: "#ffffff",
  cardForeground: "#101926",
  popover: "#ffffff",
  popoverForeground: "#101926",
  primary: "#096acb",
  primaryForeground: "#fbfcfd",
  primarySoft: "#e1f0ff",
  secondary: "#eef2f7",
  secondaryForeground: "#242e3d",
  muted: "#f0f4f7",
  mutedForeground: "#6a727e",
  accent: "#00ac7c",
  accentForeground: "#fbfcfd",
  success: "#00a062",
  successForeground: "#fbfcfd",
  successSoft: "#d9f7e5",
  warning: "#e79c27",
  warningForeground: "#331b06",
  warningSoft: "#fff0cc",
  destructive: "#db2a3d",
  destructiveForeground: "#fbfcfd",
  destructiveSoft: "#ffeae9",
  border: "#e2e7eb",
  input: "#e2e7eb",
  ring: "#096acb",
  chart1: "#096acb",
  chart2: "#00ac7c",
  chart3: "#e79c27",
  chart4: "#9964e5",
  chart5: "#db2a3d",
  /** Bottom sheet / dialog backdrop (web `black/50`). */
  overlay: "rgba(16, 25, 38, 0.5)",
} as const;

/** End colour of the 135deg `gradient-brand` (55% primary + 45% accent, oklab mix). */
export const gradientBrandEnd = "#0092a4";

/** Colour used by the map placeholder grid and route path overlays. */
export const gridPrimary = "#096acb";
