import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
  User,
  Lock,
  Bell,
  Globe,
  Phone,
  BadgeCheck,
  Info,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Shield,
  type LucideIcon,
} from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const groups: Array<{ title: string; items: Array<{ icon: LucideIcon; label: string; to: string }> }> = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Edit profile", to: "/create-profile" },
      { icon: BadgeCheck, label: "Verification status", to: "/verification" },
      { icon: Phone, label: "Emergency contacts", to: "/safety" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Globe, label: "Language — English", to: "/settings" },
      { icon: Shield, label: "Privacy", to: "/settings" },
      { icon: Lock, label: "Security", to: "/settings" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help centre", to: "/settings" },
      { icon: FileText, label: "Terms & privacy", to: "/settings" },
      { icon: Info, label: "About Companion", to: "/" },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogOut = async () => {
    try {
      await signOut();
    } catch {
      // The session may already be gone — the route guard below sends the
      // user back to the welcome screen either way.
    }
  };

  return (
    <PhoneShell>
      <TopBar title="Settings" back onBack={() => router.back()} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 20 }}>
          <View style={[styles.card]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Bell size={16} color={colors.primary} />
              <AppText size="sm" weight={600}>
                Notifications
              </AppText>
            </View>
            {["Ride requests", "Ride reminders", "Safety alerts", "Product updates"].map((l, i) => (
              <SettingsSwitchRow key={l} label={l} defaultOn={i < 3} divider={i > 0} />
            ))}
          </View>

          {groups.map((g) => (
            <View key={g.title}>
              <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ marginBottom: 8, paddingHorizontal: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {g.title}
              </AppText>
              <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: "hidden" }}>
                {g.items.map(({ icon: Icon, label, to }, i) => (
                  <Pressable
                    key={label}
                    onPress={() => router.push(to as Href)}
                    style={({ pressed }) => [
                      { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, opacity: pressed ? 0.7 : 1 },
                      i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}
                  >
                    <Icon size={18} color={colors.primary} />
                    <AppText size="sm" weight={500} style={{ flex: 1 }}>
                      {label}
                    </AppText>
                    <ChevronRight size={16} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <Button variant="ghost" block style={{ height: 48, borderRadius: 16 }} onPress={handleLogOut}>
            <LogOut size={16} color={colors.destructive} />
            <AppText size="sm" weight={600} color={colors.destructive}>
              Log out
            </AppText>
          </Button>
          <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11, textAlign: "center", paddingBottom: 16 }}>
            Companion v1.0.0
          </AppText>
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}

const styles = {
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    ...shadows.soft,
  },
};

function SettingsSwitchRow({ label, defaultOn, divider }: { label: string; defaultOn: boolean; divider: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
        divider && { borderTopWidth: 1, borderTopColor: colors.border },
      ]}
    >
      <AppText size="sm">{label}</AppText>
      <Switch value={on} onValueChange={setOn} />
    </View>
  );
}
