import { View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { ScaleIn } from "@/components/ui/animations";

export function EmptyState({
  icon,
  title,
  body,
  action,
  style,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 56 }, style]}>
      <ScaleIn>
        <View
          style={{
            marginBottom: 16,
            height: 64,
            width: 64,
            borderRadius: radius["2xl"],
            backgroundColor: colors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
      </ScaleIn>
      <AppText size="base" family="display" weight={700} style={{ textAlign: "center" }}>
        {title}
      </AppText>
      <AppText size="sm" color={colors.mutedForeground} style={{ marginTop: 6, maxWidth: 260, textAlign: "center" }}>
        {body}
      </AppText>
      {action ? <View style={{ marginTop: 20 }}>{action}</View> : null}
    </View>
  );
}

export function StatusBanner({
  tone = "info",
  title,
  body,
  icon,
  style,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title: string;
  body?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const tones = {
    info: { border: `${colors.primary}33`, bg: colors.primarySoft, fg: colors.primary },
    success: { border: `${colors.success}33`, bg: colors.successSoft, fg: colors.success },
    warning: { border: `${colors.warning}4D`, bg: colors.warningSoft, fg: colors.warningForeground },
    danger: { border: `${colors.destructive}33`, bg: colors.destructiveSoft, fg: colors.destructive },
  }[tone];

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: tones.border,
          backgroundColor: tones.bg,
          padding: 14,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginTop: 2 }}>{icon}</View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText size="sm" weight={600} color={tones.fg}>
          {title}
        </AppText>
        {body ? (
          <AppText size="xs" color={tones.fg} style={{ marginTop: 2, opacity: 0.9 }}>
            {body}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
