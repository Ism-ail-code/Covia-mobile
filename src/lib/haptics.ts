/**
 * Covia Haptics — tactile feedback helpers.
 * Uses expo-haptics when available, falls back silently.
 */

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

let Haptics: any = null;

try {
  Haptics = require("expo-haptics");
} catch {
  // expo-haptics not installed — all functions become no-ops
}

/** Trigger a haptic feedback pattern. No-op if expo-haptics is not installed. */
export async function triggerHaptic(pattern: HapticPattern = "light"): Promise<void> {
  if (!Haptics) return;

  try {
    switch (pattern) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Haptic failure should never crash the app
  }
}

/** Trigger haptic feedback only if the user hasn't disabled it. */
export async function triggerHapticIfEnabled(
  enabled: boolean,
  pattern: HapticPattern = "light",
): Promise<void> {
  if (enabled) {
    await triggerHaptic(pattern);
  }
}
