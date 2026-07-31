import { Image, View, type ImageStyle, type StyleProp } from "react-native";
import { useState } from "react";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";

type RingToken = "primarySoft";

type Props = {
  src?: string | null;
  /** Full name used to derive the initials fallback. */
  name?: string;
  /** Direct fallback override (takes precedence over `name`). */
  fallback?: string;
  size?: number;
  /** Border ring around the avatar, e.g. `ring="primarySoft"` or a custom object. */
  ring?: RingToken | { color: string; width?: number };
  style?: StyleProp<ImageStyle>;
  alt?: string;
};

const ringColors: Record<RingToken, { color: string; width: number }> = {
  primarySoft: { color: colors.primarySoft, width: 4 },
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Circular avatar with initials fallback, mirrors the web Avatar. */
export function Avatar({ src, name, fallback, size = 40, ring, style, alt }: Props) {
  const [failed, setFailed] = useState(false);
  const ringStyle = typeof ring === "string" ? ringColors[ring] : ring;
  const label = fallback ?? (name ? initials(name) : "");
  const circle = { height: size, width: size, borderRadius: radius.full };
  return (
    <View
      style={[
        circle,
        {
          backgroundColor: colors.muted,
          overflow: "hidden",
          borderWidth: ringStyle ? ringStyle.width ?? 2 : 0,
          borderColor: ringStyle?.color ?? "transparent",
        },
      ]}
    >
      {src && !failed ? (
        <Image
          source={{ uri: src }}
          accessibilityLabel={alt ?? name}
          onError={() => setFailed(true)}
          style={[{ height: "100%", width: "100%" }, style]}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <AppText size="sm" weight={600} color={colors.mutedForeground} style={{ fontSize: Math.max(10, size * 0.32) }}>
            {label}
          </AppText>
        </View>
      )}
    </View>
  );
}
