import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { ShieldAlert, Phone, Plus, AlertTriangle, Lightbulb, CheckCircle2, Trash2 } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/app/EmptyState";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { validateEmergencyContact } from "@/lib/validation";
import { safetyTips } from "@/data/mock";

export default function Safety() {
  const router = useRouter();
  const toast = useToast();
  const { profile, saveEmergencyContact, removeEmergencyContact, busy } = useAuth();

  const contact = profile?.emergencyContact ?? null;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const startEditing = () => {
    setName(contact?.name ?? "");
    setPhone(contact?.phone ?? "");
    setRelationship(contact?.relationship ?? "");
    setFormError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    const validationError = validateEmergencyContact({ name, phone, relationship });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    try {
      await saveEmergencyContact({ name: name.trim(), phone: phone.trim(), relationship: relationship.trim() });
      setEditing(false);
      toast.success("Emergency contact saved");
    } catch {
      setFormError("Couldn't save the contact right now. Please try again.");
    }
  };

  const handleRemove = async () => {
    setFormError(null);
    try {
      await removeEmergencyContact();
      setEditing(false);
      toast.success("Emergency contact removed");
    } catch {
      setFormError("Couldn't remove the contact right now. Please try again.");
    }
  };

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
              Emergency contact
            </AppText>

            {!editing ? (
              contact ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
                    <View style={{ height: 36, width: 36, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                      <Phone size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText size="sm" weight={500} numberOfLines={1}>
                        {contact.name}
                      </AppText>
                      <AppText size="xs" color={colors.mutedForeground}>
                        {contact.relationship} · {contact.phone}
                      </AppText>
                    </View>
                    <Pressable onPress={() => startEditing()} hitSlop={8}>
                      <AppText size="xs" weight={600} color={colors.primary}>
                        Edit
                      </AppText>
                    </Pressable>
                  </View>
                  <Button variant="ghost" block style={{ height: 40, borderRadius: 16 }} onPress={handleRemove} disabled={busy}>
                    <Trash2 size={14} color={colors.destructive} />
                    <AppText size="sm" weight={600} color={colors.destructive}>
                      Remove contact
                    </AppText>
                  </Button>
                </>
              ) : (
                <>
                  <AppText size="xs" color={colors.mutedForeground} style={{ lineHeight: 18 }}>
                    Add someone you trust — SOS alerts and share-trip updates go to them.
                  </AppText>
                  <Button variant="secondary" block style={{ marginTop: 12, height: 44, borderRadius: 16 }} onPress={startEditing}>
                    <Plus size={16} color={colors.secondaryForeground} />
                    <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                      Add contact
                    </AppText>
                  </Button>
                </>
              )
            ) : (
              <View style={{ gap: 14 }}>
                <View style={{ gap: 8 }}>
                  <Label>Name</Label>
                  <Input
                    style={{ height: 44, borderRadius: radius.lg, backgroundColor: colors.background }}
                    placeholder="e.g. Amina Yusuf"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
                <View style={{ gap: 8 }}>
                  <Label>Phone number</Label>
                  <Input
                    style={{ height: 44, borderRadius: radius.lg, backgroundColor: colors.background }}
                    placeholder="+234 800 000 0000"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
                <View style={{ gap: 8 }}>
                  <Label>Relationship</Label>
                  <Input
                    style={{ height: 44, borderRadius: radius.lg, backgroundColor: colors.background }}
                    placeholder="e.g. Parent, Partner, Friend"
                    value={relationship}
                    onChangeText={setRelationship}
                  />
                </View>
                {formError ? (
                  <AppText size="xs" color={colors.destructive} style={{ lineHeight: 18 }}>
                    {formError}
                  </AppText>
                ) : null}
                <Button block style={{ height: 44, borderRadius: 16 }} disabled={busy} onPress={handleSave}>
                  <AppText size="sm" weight={600} color={colors.primaryForeground}>
                    {busy ? "Saving…" : "Save contact"}
                  </AppText>
                </Button>
                <Button variant="ghost" block style={{ height: 40, borderRadius: 16 }} onPress={() => setEditing(false)}>
                  <AppText size="sm" color={colors.mutedForeground}>
                    Cancel
                  </AppText>
                </Button>
              </View>
            )}
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
