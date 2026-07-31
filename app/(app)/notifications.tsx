import { View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Check, X, UserPlus, CalendarX, Clock, Play, Flag, ShieldAlert } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { EmptyState } from "@/components/app/EmptyState";
import { Stagger } from "@/components/ui/animations";
import { notifications, type AppNotification } from "@/data/mock";

const icons = {
  request: UserPlus,
  approved: Check,
  rejected: X,
  joined: UserPlus,
  cancelled: CalendarX,
  reminder: Clock,
  started: Play,
  completed: Flag,
  emergency: ShieldAlert,
} as const;

export default function Notifications() {
  const router = useRouter();
  return (
    <PhoneShell>
      <TopBar title="Notifications" subtitle="3 unread" back onBack={() => router.back()} />
      <Screen>
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
          {notifications.length ? (
            notifications.map((n: AppNotification, i) => {
              const Icon = icons[n.kind];
              const danger = n.kind === "emergency" || n.kind === "rejected" || n.kind === "cancelled";
              return (
                <Stagger key={n.id} index={i}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      padding: 16,
                      borderColor: n.unread ? `${colors.primary}33` : colors.border,
                      backgroundColor: n.unread ? `${colors.primarySoft}80` : colors.card,
                    }}
                  >
                    <View
                      style={{
                        height: 36,
                        width: 36,
                        borderRadius: radius.xl,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: danger ? colors.destructiveSoft : colors.primarySoft,
                      }}
                    >
                      <Icon size={18} color={danger ? colors.destructive : colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                        <AppText size="sm" weight={600} numberOfLines={1} style={{ flex: 1 }}>
                          {n.title}
                        </AppText>
                        <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                          {n.time}
                        </AppText>
                      </View>
                      <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 2 }}>
                        {n.body}
                      </AppText>
                    </View>
                  </View>
                </Stagger>
              );
            })
          ) : (
            <EmptyState
              icon={<Bell size={28} color={colors.primary} />}
              title="Nothing new"
              body="Ride updates and safety alerts will appear here."
            />
          )}
        </View>
      </Screen>
    </PhoneShell>
  );
}
