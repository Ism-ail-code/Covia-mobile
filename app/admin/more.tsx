import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Flag, Gavel, type LucideIcon } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { AdminTabBar } from "@/components/admin/AdminTabBar";

const liveLinks: Array<{ to: string; label: string; icon: LucideIcon; caption: string }> = [
  { to: "/admin/reports", label: "Reports", icon: Flag, caption: "Confirm or dismiss reports" },
  { to: "/admin/appeals", label: "Appeals", icon: Gavel, caption: "Decide moderation appeals" },
];

const comingSoon = [
  "Moderation rules editor",
  "Safety configuration",
  "Analytics deep-dive",
  "Audit log & monitoring",
  "Admin team management",
];

export default function AdminMore() {
  const router = useRouter();
  return (
    <PhoneShell>
      <Screen>
        <TopBar title="More" subtitle="Operations" />
        <View style={{ paddingHorizontal: gutter, paddingTop: 16, gap: 10 }}>
          {liveLinks.map(({ to, label, icon: Icon, caption }) => (
            <Pressable
              key={to}
              onPress={() => router.push(to as never)}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  borderRadius: radius["2xl"],
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  padding: 16,
                  ...shadows.soft,
                  opacity: pressed ? 0.94 : 1,
                },
              ]}
            >
              <View style={{ height: 40, width: 40, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText size="sm" weight={700}>{label}</AppText>
                <AppText size="xs" color={colors.mutedForeground}>{caption}</AppText>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}

          <View
            style={{
              borderRadius: radius["2xl"],
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              padding: 16,
              gap: 8,
              marginTop: 8,
            }}
          >
            <AppText size="sm" weight={700}>Coming in the ops batch</AppText>
            {comingSoon.map((item) => (
              <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ height: 6, width: 6, borderRadius: radius.full, backgroundColor: colors.mutedForeground }} />
                <AppText size="sm" color={colors.mutedForeground}>{item}</AppText>
              </View>
            ))}
          </View>
        </View>
        <AdminTabBar />
      </Screen>
    </PhoneShell>
  );
}
