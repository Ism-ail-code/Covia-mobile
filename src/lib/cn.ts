import type { StyleProp } from "react-native";

/** Combines style props into an array, dropping falsy entries (like `cn`). */
export function cn(...styles: Array<StyleProp<object> | null | false | undefined>) {
  return styles.filter(Boolean) as StyleProp<object>;
}
