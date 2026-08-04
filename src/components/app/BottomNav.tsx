import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Home, Compass, Plus, Clock, User, type LucideIcon } from "lucide-react-native";
import { colors, gradientBrandEnd, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";

type RouteName = "home" | "explore" | "create" | "activity" | "profile";

const items: Array<{ route: RouteName; label: string; icon: LucideIcon; primary?: boolean }> = [
  { route: "home", label: "Home", icon: Home },
  { route: "explore", label: "Explore", icon: Compass },
  { route: "create", label: "Create", icon: Plus, primary: true },
  { route: "activity", label: "Activity", icon: Clock },
  { route: "profile", label: "Profile", icon: User },
];

type Props = {
  state: { routeNames: string[]; index: number };
  navigation: { navigate: (name: string) => void };
  style?: StyleProp<ViewStyle>;
};

/** Bottom tab bar mirroring the web BottomNav (elevated gradient Create FAB). */
export function BottomNav({ state, navigation, style }: Props) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routeNames[state.index];

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
        {items.map(({ route, label, icon: Icon, primary }) => {
          if (primary) {
            return (
              <View key={route} style={{ marginTop: -28 }}>
                <Pressable
                  accessibilityLabel={label}
                  onPress={() => navigation.navigate(route)}
                  style={({ pressed }) => [
                    {
                      height: 56,
                      width: 56,
                      borderRadius: radius.lg,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      ...shadows.lifted,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.primary, gradientBrandEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon size={24} color={colors.primaryForeground} strokeWidth={2.5} />
                  </LinearGradient>
                </Pressable>
              </View>
            );
          }
          const active = activeRoute === route;
          return (
            <Pressable
              key={route}
              onPress={() => navigation.navigate(route)}
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
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
