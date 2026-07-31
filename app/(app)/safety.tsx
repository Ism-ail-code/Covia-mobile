import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { ShieldAlert, Phone, Plus, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/app/EmptyState";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { emergencyContacts, safetyTips } from "@/data/mock";

export default function Safety() {
  const router = useRouter();
  const toast = useToast();

  return (
    <PhoneShell>
      <TopBar title="Safety centre" subtitle="Support on every trip" back onBack={() => router.back()} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
          <Pressable
            onPress={() => toast.error("SOS activated", { description: "Emergency contacts notified with your live location." })}
            style={({ pressed }) => [
              {
                alignItems: "center",
                gap: 8,
                borderRadius: 24,
                backgroundColor: colors.destructive,
                paddingVertical: 28,
                opacity: pressed ? 0.95 : 1,
              },
            ]}
          >
            <ShieldAlert size={36} color={colors.destructiveForeground} />
            <AppText family="display" weight={800} size="lg" color={colors.destructiveForeground}>
              Hold for SOS
            </AppText>
            <AppText size="xs" color={colors.destructiveForeground} style={{ opacity: 0.9 }}>
              Alerts your contacts and Companion support
            </AppText>
          </Pressable>

          <StatusBanner
            tone="warning"
            icon={<AlertTriangle size={16} color={colors.warning} />}
            title="Route deviation detected"
            body="Your ride left the expected route 2 minutes ago. Are you safe?"
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              variant="secondary"
              style={{ flex: 1, height: 48, borderRadius: 16 }}
              onPress={() => toast.success("Thanks — marked as safe")}
            >
              <CheckCircle2 size={16} color={colors.secondaryForeground} />
              <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                I'm safe
              </AppText>
            </Button>
            <Button variant="destructive" style={{ flex: 1, height: 48, borderRadius: 16 }}>
              <AppText size="sm" weight={600} color={colors.destructiveForeground}>
                Need help
              </AppText>
            </Button>
          </View>

          <View style={[styles.card]}>
            <AppText size="sm" weight={600} style={{ marginBottom: 12 }}>
              Emergency contacts
            </AppText>
            {emergencyContacts.map((c, i) => (
              <View
                key={c.name}
                style={[
                  { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                ]}
              >
                <View style={{ height: 36, width: 36, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                  <Phone size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText size="sm" weight={500} numberOfLines={1}>
                    {c.name}
                  </AppText>
                  <AppText size="xs" color={colors.mutedForeground}>
                    {c.relation} · {c.phone}
                  </AppText>
                </View>
              </View>
            ))}
            <Button variant="secondary" block style={{ marginTop: 12, height: 44, borderRadius: 16 }}>
              <Plus size={16} color={colors.secondaryForeground} />
              <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                Add contact
              </AppText>
            </Button>
          </View>

          <View style={[styles.card]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Lightbulb size={16} color={colors.warning} />
              <AppText size="sm" weight={600}>
                Safety tips
              </AppText>
            </View>
            <View style={{ gap: 8 }}>
              {safetyTips.map((t) => (
                <AppText key={t} size="xs" color={colors.mutedForeground} style={{ lineHeight: 18 }}>
                  • {t}
                </AppText>
              ))}
            </View>
          </View>

          <View style={[styles.card]}>
            <AppText size="sm" weight={600} style={{ marginBottom: 8 }}>
              Report an incident
            </AppText>
            <Textarea placeholder="Tell us what happened…" style={{ borderRadius: 16, minHeight: 76 }} />
            <Button
              block
              style={{ marginTop: 12, height: 48, borderRadius: 16 }}
              onPress={() => toast.success("Report submitted", { description: "Our safety team will reach out." })}
            >
              <AppText size="sm" weight={600} color={colors.primaryForeground}>
                Submit report
              </AppText>
            </Button>
          </View>
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
