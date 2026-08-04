import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { ShieldAlert, Phone, Plus, AlertTriangle, Lightbulb, CheckCircle2, Trash2, Loader2, Star } from "lucide-react-native";
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
import { safetyTips } from "@/data/safetyTips";
import { getRideHistory } from "@/services/rides";
import {
  addEmergencyContact,
  deleteEmergencyContact,
  getCurrentPosition,
  getEmergencyContacts,
  getRideMonitoring,
  reportSafetyIncident,
  respondSafetyCheck,
  shareCurrentPosition,
  subscribeToSafetyEvents,
  triggerSos,
  updateEmergencyContact,
} from "@/services/safety";
import type { RideHistoryEntry } from "@/types/ride";
import type { EmergencyContact, RideMonitoring } from "@/types/safety";

export default function Safety() {
  const router = useRouter();
  const toast = useToast();
  const { busy } = useAuth();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [activeRide, setActiveRide] = useState<RideHistoryEntry | null>(null);
  const [monitoring, setMonitoring] = useState<RideMonitoring | null>(null);
  const [sosBusy, setSosBusy] = useState(false);
  const [checkBusy, setCheckBusy] = useState(false);
  const [incidentNote, setIncidentNote] = useState("");
  const [reporting, setReporting] = useState(false);

  const loadMonitoring = useCallback(async (rideId: string) => {
    try {
      setMonitoring(await getRideMonitoring(rideId));
    } catch {
      setMonitoring(null);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      setContacts(await getEmergencyContacts());
    } catch {
      // Contacts section degrades gracefully when offline.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const history = await getRideHistory(null, null, 1, 20);
        const active = history.entries.find((e) => e.rideStatus === "in_progress") ?? null;
        if (cancelled) return;
        setActiveRide(active);
        if (active) void loadMonitoring(active.rideId);
      } catch {
        // No active ride — SOS and monitoring sections degrade gracefully.
      }
    })();
    void loadContacts();
    return () => {
      cancelled = true;
    };
  }, [loadMonitoring, loadContacts]);

  useEffect(() => {
    if (!activeRide) return;
    const off = subscribeToSafetyEvents(activeRide.rideId, () => {
      void loadMonitoring(activeRide.rideId);
    });
    return off;
  }, [activeRide, loadMonitoring]);

  const startEditing = (contact?: EmergencyContact) => {
    setName(contact?.name ?? "");
    setPhone(contact?.phone ?? "");
    setRelationship(contact?.relationship ?? "");
    setFormError(null);
    setEditing(contact?.id ?? "new");
  };

  const handleSave = async () => {
    const validationError = validateEmergencyContact({ name, phone, relationship });
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    const input = { name: name.trim(), phone: phone.trim(), relationship: relationship.trim() };
    try {
      if (editing === "new") {
        const created = await addEmergencyContact({ ...input, isPrimary: contacts.length === 0 });
        setContacts((prev) => [...prev, created]);
        toast.success("Emergency contact added");
      } else if (editing) {
        await updateEmergencyContact(editing, input);
        setContacts((prev) => prev.map((c) => (c.id === editing ? { ...c, ...input } : c)));
        toast.success("Emergency contact updated");
      }
      setEditing(null);
    } catch {
      setFormError("Couldn't save the contact right now. Please try again.");
    }
  };

  const handleRemove = async (contactId: string) => {
    setFormError(null);
    try {
      await deleteEmergencyContact(contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setEditing(null);
      toast.success("Emergency contact removed");
    } catch {
      setFormError("Couldn't remove the contact right now. Please try again.");
    }
  };

  const handleSos = async () => {
    if (!activeRide || sosBusy) {
      if (!activeRide) toast.error("No active ride", { description: "SOS is available while your ride is in progress." });
      return;
    }
    setSosBusy(true);
    try {
      const position = await getCurrentPosition();
      await triggerSos(activeRide.rideId, position ?? undefined);
      if (position) {
        void shareCurrentPosition(activeRide.rideId).catch(() => {});
      }
      toast.success("SOS activated", { description: "Emergency contacts and ride participants were alerted." });
    } catch (e) {
      toast.error((e as Error).message || "Couldn't activate SOS.");
    } finally {
      setSosBusy(false);
    }
  };

  const handleSafe = async () => {
    if (!activeRide || checkBusy) return;
    setCheckBusy(true);
    try {
      await respondSafetyCheck(activeRide.rideId, true, true);
      toast.success("Confirmed", { description: "Thanks — marked as safe." });
      await loadMonitoring(activeRide.rideId);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't confirm right now.");
    } finally {
      setCheckBusy(false);
    }
  };

  const handleNeedHelp = async () => {
    if (!activeRide || checkBusy) return;
    setCheckBusy(true);
    try {
      await respondSafetyCheck(activeRide.rideId, false, false);
      toast.error("Help requested", { description: "Emergency contacts were alerted with your location." });
      await loadMonitoring(activeRide.rideId);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't request help right now.");
    } finally {
      setCheckBusy(false);
    }
  };

  const handleReport = async () => {
    if (reporting) return;
    const note = incidentNote.trim();
    if (!note) {
      toast.error("Add a note", { description: "Tell us what happened first." });
      return;
    }
    if (!activeRide) {
      toast.error("No active ride", { description: "Incident reports need a ride in progress." });
      return;
    }
    setReporting(true);
    try {
      await reportSafetyIncident(activeRide.rideId, note);
      setIncidentNote("");
      toast.success("Report submitted", { description: "Our safety team will reach out." });
    } catch (e) {
      toast.error((e as Error).message || "Couldn't submit the report.");
    } finally {
      setReporting(false);
    }
  };

  const pendingCheck = monitoring?.checkRequiredAt != null;

  return (
    <PhoneShell>
      <TopBar
        title="Safety centre"
        subtitle={activeRide ? `Monitoring ride to ${activeRide.destination}` : "Support on every trip"}
        back
        onBack={() => router.back()}
      />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
          <Pressable
            onLongPress={handleSos}
            delayLongPress={800}
            disabled={sosBusy}
            accessibilityLabel="Hold for SOS"
            accessibilityRole="button"
            style={({ pressed }) => [
              {
                alignItems: "center",
                gap: 8,
                borderRadius: 24,
                backgroundColor: colors.destructive,
                paddingVertical: 28,
                opacity: pressed || sosBusy ? 0.95 : 1,
              },
            ]}
          >
            {sosBusy ? (
              <Loader2 size={36} color={colors.destructiveForeground} />
            ) : (
              <ShieldAlert size={36} color={colors.destructiveForeground} />
            )}
            <AppText family="display" weight={800} size="lg" color={colors.destructiveForeground}>
              Hold for SOS
            </AppText>
            <AppText size="xs" color={colors.destructiveForeground} style={{ opacity: 0.9 }}>
              {activeRide
                ? `Alerts your contacts and shares your live location on the ride to ${activeRide.destination}`
                : "Alerts your contacts and Covia support"}
            </AppText>
          </Pressable>

          {pendingCheck ? (
            <>
              <StatusBanner
                tone="warning"
                icon={<AlertTriangle size={16} color={colors.warning} />}
                title="Are you safe?"
                body="Covia hasn't seen movement for a while. Confirm you're safe with your device biometrics, or request help."
              />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Button
                  variant="secondary"
                  style={{ flex: 1, height: 48, borderRadius: 16 }}
                  disabled={checkBusy}
                  onPress={handleSafe}
                >
                  <CheckCircle2 size={16} color={colors.secondaryForeground} />
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                    I'm safe
                  </AppText>
                </Button>
                <Button
                  variant="destructive"
                  style={{ flex: 1, height: 48, borderRadius: 16 }}
                  disabled={checkBusy}
                  onPress={handleNeedHelp}
                >
                  <AppText size="sm" weight={600} color={colors.destructiveForeground}>
                    Need help
                  </AppText>
                </Button>
              </View>
            </>
          ) : null}

          <View style={[styles.card]}>
            <AppText size="sm" weight={600} style={{ marginBottom: 12 }}>
              Emergency contacts
            </AppText>

            {!editing ? (
              contacts.length > 0 ? (
                <>
                  {contacts.map((c) => (
                    <View key={c.id}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
                        <View style={{ height: 36, width: 36, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                          <Phone size={16} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <AppText size="sm" weight={500} numberOfLines={1}>
                              {c.name}
                            </AppText>
                            {c.isPrimary ? <Star size={12} color={colors.warning} fill={colors.warning} /> : null}
                          </View>
                          <AppText size="xs" color={colors.mutedForeground}>
                            {c.relationship} · {c.phone}
                          </AppText>
                        </View>
                        <Pressable onPress={() => startEditing(c)} hitSlop={8}>
                          <AppText size="xs" weight={600} color={colors.primary}>
                            Edit
                          </AppText>
                        </Pressable>
                        <Pressable onPress={() => void handleRemove(c.id)} hitSlop={8} disabled={busy} accessibilityLabel="Remove emergency contact" accessibilityRole="button">
                          <Trash2 size={16} color={colors.destructive} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  <Button variant="ghost" block style={{ height: 40, borderRadius: 16 }} onPress={() => startEditing()}>
                    <Plus size={14} color={colors.primary} />
                    <AppText size="sm" weight={600} color={colors.primary}>
                      Add another contact
                    </AppText>
                  </Button>
                </>
              ) : (
                <>
                  <AppText size="xs" color={colors.mutedForeground} style={{ lineHeight: 18 }}>
                    Add someone you trust — SOS alerts and share-trip updates go to them.
                  </AppText>
                  <Button variant="secondary" block style={{ marginTop: 12, height: 44, borderRadius: 16 }} onPress={() => startEditing()}>
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
                    {busy ? "Saving…" : editing === "new" ? "Save contact" : "Update contact"}
                  </AppText>
                </Button>
                <Button variant="ghost" block style={{ height: 40, borderRadius: 16 }} onPress={() => setEditing(null)}>
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
            <Textarea
              placeholder={activeRide ? "Tell us what happened…" : "Start a ride first — reports are tied to a ride."}
              style={{ borderRadius: 16, minHeight: 76 }}
              value={incidentNote}
              onChangeText={setIncidentNote}
              editable={!!activeRide}
            />
            <Button
              block
              style={{ marginTop: 12, height: 48, borderRadius: 16 }}
              disabled={reporting || !activeRide}
              onPress={handleReport}
            >
              <AppText size="sm" weight={600} color={colors.primaryForeground}>
                {reporting ? "Submitting…" : "Submit report"}
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
