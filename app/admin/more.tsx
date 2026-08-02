import { View } from "react-native";
import { colors, gutter, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { AdminTabBar } from "@/components/admin/AdminTabBar";

const comingSoon = [
  "Moderation rules editor",
  "Reports & appeals queues",
  "Suspend / ban / cancel actions",
  "Safety configuration",
  "Analytics deep-dive",
  "Audit log & monitoring",
  "Admin team management",
];

export default function AdminMore() {
  return (
    <PhoneShell>
      <Screen>
        <TopBar title="More" subtitle="Operations" />
        <View style={{ paddingHorizontal: gutter, paddingTop: 16, gap: 12 }}>
          <View
            style={{
              borderRadius: radius["2xl"],
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              padding: 16,
              gap: 8,
            }}
          >
            <AppText size="sm" weight={700}>Coming in the moderation & ops batches</AppText>
            <AppText size="xs" color={colors.mutedForeground}>
              The read-only console foundation is live (dashboard, users, rides, verification desk).
            </AppText>
          </View>
          {comingSoon.map((item) => (
            <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ height: 6, width: 6, borderRadius: radius.full, backgroundColor: colors.mutedForeground }} />
              <AppText size="sm" color={colors.mutedForeground}>{item}</AppText>
            </View>
          ))}
        </View>
        <AdminTabBar />
      </Screen>
    </PhoneShell>
  );
}
