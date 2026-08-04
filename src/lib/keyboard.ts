/**
 * Covia Keyboard — keyboard dismissal helpers.
 * Provides consistent keyboard handling across the app.
 */

import { Keyboard, Platform } from "react-native";

/** Dismiss the keyboard. Safe to call on any platform. */
export function dismissKeyboard(): void {
  Keyboard.dismiss();
}

/** Check if the platform supports keyboard avoiding view. */
export function supportsKeyboardAvoiding(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/** Get the keyboard vertical offset for KeyboardAvoidingView. */
export function getKeyboardVerticalOffset(): number {
  // iOS needs extra offset due to status bar
  return Platform.OS === "ios" ? 90 : 0;
}

/** Common KeyboardAvoidingView props for consistent behavior. */
export const keyboardAvoidingProps = {
  behavior: Platform.OS === "ios" ? ("padding" as const) : ("height" as const),
  keyboardVerticalOffset: getKeyboardVerticalOffset(),
};
