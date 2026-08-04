/**
 * Covia Version — semantic versioning and build metadata.
 *
 * Reads version info from app.json and provides helpers for
 * display, comparison, and compatibility checks.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

export type VersionInfo = {
  version: string;
  buildNumber: string;
  platform: "ios" | "android" | "web";
};

/** Get the current app version info. */
export function getVersionInfo(): VersionInfo {
  const config = Constants.default?.expoConfig ?? {};
  return {
    version: config.version ?? "1.0.0",
    buildNumber:
      Platform.OS === "ios"
        ? String((config as any).ios?.buildNumber ?? "1")
        : String((config as any).android?.versionCode ?? 1),
    platform: Platform.OS as "ios" | "android" | "web",
  };
}

/** Format version for display: "v1.0.0 (1)" */
export function formatVersion(info?: VersionInfo): string {
  const v = info ?? getVersionInfo();
  return `v${v.version} (${v.buildNumber})`;
}

/** Format version for settings: "Version 1.0.0" */
export function formatVersionShort(info?: VersionInfo): string {
  const v = info ?? getVersionInfo();
  return `Version ${v.version}`;
}

/** Compare two semver strings. Returns -1, 0, or 1. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na < nb ? -1 : 1;
  }
  return 0;
}

/** Check if version a is at least version b. */
export function isVersionAtLeast(current: string, minimum: string): boolean {
  return compareVersions(current, minimum) >= 0;
}
