import { View, type StyleProp, type ViewStyle } from "react-native";
import {
  BadgeCheck,
  GraduationCap,
  Phone,
  Mail,
  Star,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import type { Verification } from "@/data/mock";

const verificationMap: Record<
  Verification,
  { icon: LucideIcon; label: string; tone: "primary" | "accent" | "muted" }
> = {
  id: { icon: BadgeCheck, label: "ID verified", tone: "primary" },
  student: { icon: GraduationCap, label: "Student", tone: "accent" },
  phone: { icon: Phone, label: "Phone", tone: "muted" },
  email: { icon: Mail, label: "Email", tone: "muted" },
};

const toneStyles = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  accent: { bg: colors.successSoft, fg: colors.success },
  muted: { bg: colors.muted, fg: colors.mutedForeground },
};

export function VerificationBadges({
  items,
  compact = false,
  style,
}: {
  items: Verification[];
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }, style]}>
      {items.map((v) => {
        const { icon: Icon, label, tone } = verificationMap[v];
        const t = toneStyles[tone];
        return (
          <View
            key={v}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderRadius: radius.full,
              paddingHorizontal: 8,
              paddingVertical: 2,
              backgroundColor: t.bg,
            }}
          >
            <Icon size={12} color={t.fg} strokeWidth={2.5} />
            {compact ? null : (
              <AppText size="xs" weight={600} color={t.fg} style={{ fontSize: 10, lineHeight: 12 }}>
                {label}
              </AppText>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Star size={14} color={colors.warning} fill={colors.warning} strokeWidth={2} />
      <AppText size="xs" weight={600}>
        {value.toFixed(1)}
      </AppText>
      {count !== undefined ? (
        <AppText size="xs" weight={400} color={colors.mutedForeground}>
          ({count})
        </AppText>
      ) : null}
    </View>
  );
}

export function ReliabilityPill({ value }: { value: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: radius.full,
        backgroundColor: colors.successSoft,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
    >
      <ShieldCheck size={12} color={colors.success} strokeWidth={2.5} />
      <AppText size="xs" weight={600} color={colors.success} style={{ fontSize: 10, lineHeight: 12 }}>
        {value}% reliable
      </AppText>
    </View>
  );
}

export function StatBlock({
  label,
  value,
  icon,
  style,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flex: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.secondary,
          padding: 12,
          alignItems: "center",
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginBottom: 4, alignItems: "center" }}>{icon}</View> : null}
      <AppText size="lg" family="display" weight={700} style={{ lineHeight: 28 }}>
        {value}
      </AppText>
      <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11, marginTop: 4 }}>
        {label}
      </AppText>
    </View>
  );
}
