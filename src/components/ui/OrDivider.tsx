/**
 * OrDivider — horizontal "or" separator between the Google and email
 * auth options (web `relative flex items-center gap-4` pattern).
 */

import { View } from "react-native";
import { colors } from "@/theme";
import { AppText } from "./AppText";

export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <AppText size="xs" color={colors.mutedForeground}>
        {label}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}
