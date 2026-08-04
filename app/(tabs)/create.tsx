import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Flag, Calendar, Clock, Users, Info, Minus, Plus, Loader2 } from "lucide-react-native";
import { colors, radius, gutter } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Chip } from "@/components/ui/Chip";
import { StatusBanner } from "@/components/app/EmptyState";
import { RouteLine } from "@/components/app/RouteLine";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { createRide, publishRide, validateRideInput, RideError } from "@/services/rides";
import { PICKUP_TYPE_LABELS, type FareMode, type PickupType } from "@/types/ride";
import { naira } from "@/lib/format";

const PICKUP_OPTIONS = Object.entries(PICKUP_TYPE_LABELS) as Array<[PickupType, string]>;

function ToggleRow({
  label,
  desc,
  value,
  onValueChange,
  divider,
}: {
  label: string;
  desc: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  divider?: boolean;
}) {
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
        divider && { borderTopWidth: 1, borderTopColor: colors.border },
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText size="sm" weight={500}>
          {label}
        </AppText>
        <AppText size="xs" color={colors.mutedForeground}>
          {desc}
        </AppText>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function CreateRide() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [pickup, setPickup] = useState("");
  const [pickupLandmark, setPickupLandmark] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(() => toISODate(new Date(Date.now() + 24 * 3600 * 1000)));
  const [time, setTime] = useState("08:15");
  const [pickupType, setPickupType] = useState<PickupType>("main_road");
  const [seats, setSeats] = useState(3);
  const [fareType, setFareType] = useState<FareMode>("smart");
  const [fixedFare, setFixedFare] = useState("");
  const [womenOnly, setWomenOnly] = useState(false);
  const [studentOnly, setStudentOnly] = useState(false);
  const [notes, setNotes] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const fixedFareNumber = fixedFare ? Number(fixedFare) : null;
  const previewFare =
    fareType === "fixed" && fixedFareNumber != null ? naira(fixedFareNumber) : "Smart split";

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const departureDate = new Date(`${date}T${time}:00`);
      if (isNaN(departureDate.getTime())) {
        toast.error("Enter a valid departure date and time.");
        return;
      }
      const departureTime = departureDate.toISOString();
      const input = {
        originLoc: { display_name: pickup.trim() },
        pickupPointLoc: { display_name: pickup.trim(), full_address: pickupLandmark.trim() || null },
        destinationLoc: { display_name: destination.trim() },
        pickupType,
        departureTime,
        totalSeats: seats,
        fareMode: fareType,
        fixedFare: fareType === "fixed" ? fixedFareNumber : null,
        notes: notes.trim() || null,
        isStudentOnly: studentOnly,
        isWomenOnly: womenOnly,
      };
      const validationError = validateRideInput(input);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      const ride = await createRide(input);
      await publishRide(ride.id);
      toast.success("Ride published", {
        description: "Verified Covians nearby have been notified.",
      });
      router.replace(`/ride/${ride.id}`);
    } catch (e) {
      toast.error(e instanceof RideError ? e.message : "Couldn't publish the ride — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhoneShell>
      <TopBar
        title="Create a ride"
        subtitle="Covians book the ride together"
        back
        onBack={() => router.navigate("/home")}
      />
      <Screen>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 20, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBanner
            tone="info"
            icon={<Info size={16} color={colors.primary} />}
            title="Covia doesn't provide drivers"
            body="You'll book on Uber, inDrive or Yango — we handle the matching and the split."
          />

          <FormField
            label="Pickup location"
            icon={<MapPin size={16} color={colors.mutedForeground} />}
            value={pickup}
            onChangeText={setPickup}
          />
          <FormField
            label="Pickup landmark (optional)"
            icon={<Flag size={16} color={colors.mutedForeground} />}
            value={pickupLandmark}
            onChangeText={setPickupLandmark}
          />
          <FormField
            label="Destination"
            icon={<Flag size={16} color={colors.mutedForeground} />}
            value={destination}
            onChangeText={setDestination}
          />

          <View style={{ gap: 8 }}>
            <Label>Pickup point type</Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {PICKUP_OPTIONS.map(([value, label]) => (
                <Chip key={value} active={pickupType === value} onPress={() => setPickupType(value)}>
                  {label}
                </Chip>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Label>Date</Label>
              <Input
                icon={<Calendar size={16} color={colors.mutedForeground} />}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                containerStyle={{ minHeight: 48 }}
                style={{ height: 48, borderRadius: radius.lg, paddingLeft: 40 }}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Label>Time</Label>
              <Input
                icon={<Clock size={16} color={colors.mutedForeground} />}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                autoCapitalize="none"
                containerStyle={{ minHeight: 48 }}
                style={{ height: 48, borderRadius: radius.lg, paddingLeft: 40 }}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Label>Seats to share</Label>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Users size={16} color={colors.mutedForeground} />
                <AppText size="sm" color={colors.mutedForeground}>
                  {seats} Covians
                </AppText>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => setSeats((s) => Math.max(1, s - 1))}
                  accessibilityLabel="Decrease seats"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    {
                      height: 44,
                      width: 44,
                      borderRadius: radius.xl,
                      backgroundColor: colors.secondary,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Minus size={16} color={colors.secondaryForeground} />
                </Pressable>
                <Pressable
                  onPress={() => setSeats((s) => Math.min(10, s + 1))}
                  accessibilityLabel="Increase seats"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    {
                      height: 44,
                      width: 44,
                      borderRadius: radius.xl,
                      backgroundColor: colors.secondary,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Plus size={16} color={colors.secondaryForeground} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Label>Fare type</Label>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["fixed", "smart"] as FareMode[]).map((f) => (
                <Chip key={f} active={fareType === f} onPress={() => setFareType(f)}>
                  {f === "fixed" ? "Fixed fare" : "Smart split"}
                </Chip>
              ))}
            </View>
            <AppText size="xs" color={colors.mutedForeground}>
              {fareType === "smart"
                ? "Cost is divided by distance travelled per Covian."
                : "Everyone pays the same agreed amount per seat."}
            </AppText>
            {fareType === "fixed" ? (
              <Input
                value={fixedFare}
                onChangeText={setFixedFare}
                placeholder="Amount per seat (₦)"
                keyboardType="numeric"
                containerStyle={{ minHeight: 48, marginTop: 4 }}
                style={{ height: 48, borderRadius: radius.lg }}
              />
            ) : null}
          </View>

          <View
            style={{
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              overflow: "hidden",
            }}
          >
            {[
              { label: "Women only", desc: "Only women can request a seat", value: womenOnly, set: setWomenOnly },
              { label: "Students only", desc: "Requires a verified student badge", value: studentOnly, set: setStudentOnly },
            ].map((o, i) => (
              <ToggleRow
                key={o.label}
                label={o.label}
                desc={o.desc}
                value={o.value}
                onValueChange={o.set}
                divider={i > 0}
              />
            ))}
          </View>

          <View style={{ gap: 8 }}>
            <Label>Ride description (optional)</Label>
            <Textarea
              placeholder="Anything Covians should know — luggage space, music, stops…"
              value={notes}
              onChangeText={setNotes}
              style={{ borderRadius: radius.lg, backgroundColor: colors.background, minHeight: 84 }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              variant="secondary"
              style={{ flex: 1, height: 52, borderRadius: radius.lg }}
              onPress={() => setPreviewOpen(true)}
            >
              <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                Preview
              </AppText>
            </Button>
            <Button style={{ flex: 1, height: 52, borderRadius: radius.lg }} onPress={submit} disabled={busy}>
              {busy ? (
                <Loader2 size={16} color={colors.primaryForeground} />
              ) : (
                <AppText size="base" weight={600} color={colors.primaryForeground}>
                  Publish
                </AppText>
              )}
            </Button>
          </View>
        </ScrollView>
      </Screen>

      <Dialog visible={previewOpen} onClose={() => setPreviewOpen(false)} title="Ride preview">
        <View style={{ gap: 16 }}>
          <RouteLine
            pickup={pickup || "Pickup location"}
            destination={destination || "Destination"}
            landmark={pickupLandmark || undefined}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              ["Departs", time],
              ["Seats", `${seats}`],
              ["Est. each", previewFare],
            ].map(([l, v]) => (
              <View key={l} style={{ flex: 1, borderRadius: radius.lg, backgroundColor: colors.secondary, padding: 12, alignItems: "center" }}>
                <AppText size="sm" family="display" weight={700}>
                  {v}
                </AppText>
                <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                  {l}
                </AppText>
              </View>
            ))}
          </View>
          <Button
            block
            style={{ height: 48, borderRadius: radius.lg }}
            onPress={() => {
              setPreviewOpen(false);
              submit();
            }}
            disabled={busy}
          >
            <AppText size="sm" weight={600} color={colors.primaryForeground}>
              {busy ? "Publishing…" : "Publish ride"}
            </AppText>
          </Button>
        </View>
      </Dialog>
    </PhoneShell>
  );
}
