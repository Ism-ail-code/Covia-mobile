import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import {
  User,
  Bell,
  BadgeCheck,
  Phone,
  LogOut,
  ChevronRight,
  MessageSquare,
  type LucideIcon,
} from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/notifications";
import type { NotificationPreferences } from "@/types/notifications";
import { formatVersionShort } from "@/lib/version";

const accountItems: Array<{ icon: LucideIcon; label: string; to: string }> = [
  { icon: User, label: "Edit profile", to: "/create-profile" },
  { icon: BadgeCheck, label: "Verification status", to: "/verification" },
  { icon: Phone, label: "Emergency contacts", to: "/safety" },
  { icon: MessageSquare, label: "Send feedback", to: "/feedback" },
];

type BooleanPrefKey = {
  [K in keyof NotificationPreferences]: NotificationPreferences[K] extends boolean ? K : never;
}[keyof NotificationPreferences];

const prefRows: Array<{ key: BooleanPrefKey; label: string }> = [
  { key: "rideEnabled", label: "Ride requests & updates" },
  { key: "chatEnabled", label: "Chat messages" },
  { key: "safetyEnabled", label: "Safety alerts" },
  { key: "verificationEnabled", label: "Verification updates" },
  { key: "emailEnabled", label: "Email notifications" },
  { key: "marketingEnabled", label: "Product updates" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { signOut } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsError, setPrefsError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getNotificationPreferences()
      .then((p) => {
        if (mounted) setPrefs(p);
      })
      .catch(() => {
        if (mounted) {
          setPrefs(null);
          setPrefsError(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = useCallback(
    (key: BooleanPrefKey, value: boolean) => {
      setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev));
      updateNotificationPreferences({ [key]: value }).catch((e) => {
        setPrefs((prev) => (prev ? { ...prev, [key]: !value } : prev));
        toast.error((e as Error).message || "Couldn't save that preference.");
      });
    },
    [toast],
  );

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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Bell size={16} color={colors.primary} />
              <AppText size="sm" weight={600}>
                Notifications
              </AppText>
            </View>
            {!prefs ? (
              prefsError ? (
                <View style={{ paddingVertical: 12 }}>
                  <AppText size="xs" color={colors.destructive} style={{ marginBottom: 8 }}>
                    Couldn't load preferences.
                  </AppText>
                  <Button variant="outline" onPress={() => {
                    setPrefsError(false);
                    getNotificationPreferences()
                      .then((p) => setPrefs(p))
                      .catch(() => setPrefsError(true));
                  }}>
                    <AppText size="xs" weight={600} color={colors.primary}>Try again</AppText>
                  </Button>
                </View>
              ) : (
                <AppText size="xs" color={colors.mutedForeground} style={{ paddingVertical: 12 }}>
                  Loading preferences…
                </AppText>
              )
            ) : (
              prefRows.map(({ key, label }, i) => (
                <View
                  key={key}
                  style={[
                    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <AppText size="sm">{label}</AppText>
                  <Switch value={prefs[key]} onValueChange={(v) => toggle(key, v)} />
                </View>
              ))
            )}
          </View>

          <View>
            <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ marginBottom: 8, paddingHorizontal: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Account
            </AppText>
            <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: "hidden" }}>
              {accountItems.map(({ icon: Icon, label, to }, i) => (
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

          <Button variant="ghost" block style={{ height: 48, borderRadius: 16 }} onPress={handleLogOut}>
            <LogOut size={16} color={colors.destructive} />
            <AppText size="sm" weight={600} color={colors.destructive}>
              Log out
            </AppText>
          </Button>
          <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11, textAlign: "center", paddingBottom: 16 }}>
            {formatVersionShort()}
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
