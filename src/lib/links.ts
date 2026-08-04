/**
 * Covia Links — deep linking and URL handling utilities.
 */

import { Linking, Platform } from "react-native";

/** Open a URL in the device browser or appropriate app. */
export async function openUrl(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Open the device phone dialer with a phone number. */
export async function openPhoneDialer(phone: string): Promise<boolean> {
  const cleaned = phone.replace(/[\s()-]/g, "");
  const url = Platform.OS === "ios" ? `tel:${cleaned}` : `tel:${cleaned}`;
  return openUrl(url);
}

/** Open the device SMS app with a pre-filled message. */
export async function openSms(phone: string, message?: string): Promise<boolean> {
  const cleaned = phone.replace(/[\s()-]/g, "");
  const body = message ? `&body=${encodeURIComponent(message)}` : "";
  return openUrl(`sms:${cleaned}${body}`);
}

/** Open an email client with pre-filled fields. */
export async function openEmail(
  email: string,
  subject?: string,
  body?: string,
): Promise<boolean> {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString() ? `?${params.toString()}` : "";
  return openUrl(`mailto:${email}${query}`);
}

/** Open the app store listing for Covia. */
export async function openAppStore(): Promise<boolean> {
  const url = Platform.OS === "ios"
    ? "https://apps.apple.com/app/covia"
    : "https://play.google.com/store/apps/details?id=com.covia.app";
  return openUrl(url);
}

/** Open Google Maps with a location query. */
export async function openMaps(query: string): Promise<boolean> {
  const encoded = encodeURIComponent(query);
  const url = Platform.OS === "ios"
    ? `maps:0,0?q=${encoded}`
    : `geo:0,0?q=${encoded}`;
  return openUrl(url);
}

/** Open Google Maps with specific coordinates. */
export async function openMapsWithCoords(
  latitude: number,
  longitude: number,
  label?: string,
): Promise<boolean> {
  const q = label ? `${latitude},${longitude}(${encodeURIComponent(label)})` : `${latitude},${longitude}`;
  const url = Platform.OS === "ios"
    ? `maps:0,0?q=${q}`
    : `geo:0,0?q=${q}`;
  return openUrl(url);
}

/** Open device settings. */
export async function openSettings(): Promise<boolean> {
  return openUrl(Platform.OS === "ios" ? "app-settings:" : "package:com.covia.app");
}
