import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Flag,
  Gavel,
  History,
  Scale,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { useAuth } from "@/context/AuthContext";
import { can, type AdminPermission } from "@/types/admin";

type LinkItem = { to: string; label: string; icon: LucideIcon; caption: string; permission: AdminPermission };

const links: LinkItem[] = [
  { to: "/admin/reports", label: "Reports", icon: Flag, caption: "Confirm or dismiss reports", permission: "report.view" },
  { to: "/admin/appeals", label: "Appeals", icon: Gavel, caption: "Decide moderation appeals", permission: "appeal.view" },
  { to: "/admin/rules", label: "Moderation rules", icon: Scale, caption: "Automatic enforcement thresholds", permission: "config.view" },
  { to: "/admin/safety", label: "Safety configuration", icon: ShieldCheck, caption: "Ride safety monitoring parameters", permission: "config.view" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, caption: "Users, rides, safety & platform stats", permission: "analytics.view" },
  { to: "/admin/audit", label: "Audit log", icon: History, caption: "Every admin action, searchable", permission: "audit.view" },
  { to: "/admin/monitoring", label: "Monitoring", icon: Activity, caption: "Job runs and system events", permission: "monitor.view" },
  { to: "/admin/team", label: "Admin team", icon: UserCog, caption: "Manage roles and members", permission: "admin.manage" },
];

export default function AdminMore() {
  const router = useRouter();
  const { adminRole } = useAuth();
  const visible = links.filter((l) => can(adminRole, l.permission));

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="More" subtitle="Operations" />
        <View style={{ paddingHorizontal: gutter, paddingTop: 16, gap: 10 }}>
          {visible.map(({ to, label, icon: Icon, caption }) => (
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
        </View>
        <AdminTabBar />
      </Screen>
    </PhoneShell>
  );
}
