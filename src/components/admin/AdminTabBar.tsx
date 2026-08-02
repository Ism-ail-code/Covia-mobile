import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Users, Car, ShieldCheck, MoreHorizontal, type LucideIcon } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";

type RouteName = "index" | "users" | "rides" | "verification" | "more";

const items: Array<{ route: RouteName; label: string; icon: LucideIcon; match: string }> = [
  { route: "index", label: "Dashboard", icon: LayoutDashboard, match: "/admin" },
  { route: "users", label: "Users", icon: Users, match: "/admin/users" },
  { route: "rides", label: "Rides", icon: Car, match: "/admin/rides" },
  { route: "verification", label: "Review", icon: ShieldCheck, match: "/admin/verification" },
  { route: "more", label: "More", icon: MoreHorizontal, match: "/admin/more" },
];

/** Bottom nav for the admin console (mirrors the member BottomNav style). */
export function AdminTabBar({ style }: { style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (match: string) =>
    pathname === match || (match !== "/admin" && pathname.startsWith(match + "/"));

  return (
    <View
      style={[
        {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: `${colors.card}F2`,
          paddingTop: 8,
          paddingBottom: Math.max(8, insets.bottom),
          ...shadows.nav,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingHorizontal: 8 }}>
        {items.map(({ route, label, icon: Icon, match }) => {
          const active = isActive(match);
          return (
            <Pressable
              key={route}
              accessibilityLabel={label}
              onPress={() => router.push(route === "index" ? "/admin" : `/admin/${route}`)}
              style={({ pressed }) => [
                {
                  minWidth: 64,
                  alignItems: "center",
                  gap: 4,
                  borderRadius: radius.xl,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Icon
                size={20}
                color={active ? colors.primary : colors.mutedForeground}
                fill={active ? colors.primarySoft : "none"}
              />
              <AppText size="xs" weight={500} color={active ? colors.primary : colors.mutedForeground}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
