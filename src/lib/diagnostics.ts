/**
 * Covia Diagnostics — automatic device and environment info collection.
 *
 * Collects app version, OS, device model, build number, locale, and
 * network state. Attached to bug reports and analytics events.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

export type DeviceDiagnostics = {
  appVersion: string;
  buildNumber: string;
  osVersion: string;
  platform: "ios" | "android" | "web";
  deviceModel: string;
  locale: string;
  collectedAt: string;
};

let cached: DeviceDiagnostics | null = null;

/** Collect current device diagnostics. Results are cached for the session. */
export async function collectDiagnostics(): Promise<DeviceDiagnostics> {
  if (cached) return cached;

  const locale =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : "en-US";

  const config = Constants.default?.expoConfig ?? {};

  cached = {
    appVersion: config.version ?? "1.0.0",
    buildNumber:
      Platform.OS === "ios"
        ? String((config as any).ios?.buildNumber ?? "1")
        : String((config as any).android?.versionCode ?? 1),
    osVersion: Platform.Version.toString(),
    platform: Platform.OS as "ios" | "android" | "web",
    deviceModel: (config as any).ios?.bundleIdentifier ?? (config as any).android?.packageName ?? "Unknown Device",
    locale,
    collectedAt: new Date().toISOString(),
  };

  return cached;
}

/** Clear cached diagnostics (call on significant state changes). */
export function clearDiagnosticsCache() {
  cached = null;
}

/** Serialize diagnostics to a compact string for bug reports. */
export function diagnosticsToString(d: DeviceDiagnostics): string {
  return [
    `App: ${d.appVersion} (${d.buildNumber})`,
    `OS: ${d.platform} ${d.osVersion}`,
    `Device: ${d.deviceModel}`,
    `Locale: ${d.locale}`,
  ].join(" | ");
}
