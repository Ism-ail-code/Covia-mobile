/**
 * Covia App Info — application metadata and build information.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

/** Get the app name. */
export function getAppName(): string {
  return "Covia";
}

/** Get the app version from expo-constants. */
export function getAppVersion(): string {
  const config = Constants.default?.expoConfig ?? {};
  return config.version ?? "1.0.0";
}

/** Get the build number. */
export function getBuildNumber(): string {
  const config = Constants.default?.expoConfig ?? {};
  if (Platform.OS === "ios") {
    return String((config as any).ios?.buildNumber ?? "1");
  }
  return String((config as any).android?.versionCode ?? 1);
}

/** Get the bundle identifier or package name. */
export function getBundleId(): string {
  const config = Constants.default?.expoConfig ?? {};
  if (Platform.OS === "ios") {
    return (config as any).ios?.bundleIdentifier ?? "com.covia.app";
  }
  return (config as any).android?.packageName ?? "com.covia.app";
}

/** Get the full app info string. */
export function getAppInfoString(): string {
  return `${getAppName()} v${getAppVersion()} (${getBuildNumber()})`;
}

/** Get the platform name. */
export function getPlatformName(): string {
  return Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web";
}

/** Check if the app is running in development mode. */
export function isDevMode(): boolean {
  return __DEV__;
}

/** Check if the app is running in production mode. */
export function isProductionMode(): boolean {
  return !__DEV__;
}
