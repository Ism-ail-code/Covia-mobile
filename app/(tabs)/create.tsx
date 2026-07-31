import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Flag, Calendar, Clock, Users, Info, Minus, Plus } from "lucide-react-native";
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
import { money } from "@/data/mock";

type FareType = "Fixed fare" | "Smart split";

function ToggleRow({
  label,
  desc,
  defaultOn,
  divider,
}: {
  label: string;
  desc: string;
  defaultOn?: boolean;
  divider?: boolean;
}) {
  const [on, setOn] = useState(!!defaultOn);
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
      <Switch value={on} onValueChange={setOn} />
    </View>
  );
}

export default function CreateRide() {
  const router = useRouter();
  const toast = useToast();
  const [seats, setSeats] = useState(3);
  const [fareType, setFareType] = useState<FareType>("Smart split");
  const [pickup, setPickup] = useState("Maple Court, Lekki Phase 1");
  const [destination, setDestination] = useState("Victoria Island — Landmark Centre");
  const [previewOpen, setPreviewOpen] = useState(false);

  const publish = () => {
    toast.success("Ride published", {
      description: "Verified companions nearby have been notified.",
    });
    router.push("/activity");
  };

  return (
    <PhoneShell>
      <TopBar
        title="Create a ride"
        subtitle="Companions book the ride together"
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
            title="Companion doesn't provide drivers"
            body="You'll book on Uber, inDrive or Yango — we handle the matching and the split."
          />

          <FormField
            label="Pickup location"
            icon={<MapPin size={16} color={colors.mutedForeground} />}
            value={pickup}
            onChangeText={setPickup}
          />
          <FormField
            label="Pickup landmark"
            icon={<Flag size={16} color={colors.mutedForeground} />}
            defaultValue="Beside the blue coffee kiosk"
          />
          <FormField
            label="Destination"
            icon={<Flag size={16} color={colors.mutedForeground} />}
            value={destination}
            onChangeText={setDestination}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Label>Date</Label>
              <Input
                icon={<Calendar size={16} color={colors.mutedForeground} />}
                defaultValue="2026-08-03"
                containerStyle={{ minHeight: 48 }}
                style={{ height: 48, borderRadius: radius.lg, paddingLeft: 40 }}
              />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Label>Time</Label>
              <Input
                icon={<Clock size={16} color={colors.mutedForeground} />}
                defaultValue="08:15"
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
                  {seats} companions
                </AppText>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => setSeats((s) => Math.max(1, s - 1))}
                  style={({ pressed }) => [
                    {
                      height: 36,
                      width: 36,
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
                  onPress={() => setSeats((s) => Math.min(5, s + 1))}
                  style={({ pressed }) => [
                    {
                      height: 36,
                      width: 36,
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
              {(["Fixed fare", "Smart split"] as FareType[]).map((f) => (
                <Chip key={f} active={fareType === f} onPress={() => setFareType(f)}>
                  {f}
                </Chip>
              ))}
            </View>
            <AppText size="xs" color={colors.mutedForeground}>
              {fareType === "Smart split"
                ? "Cost is divided by distance travelled per companion."
                : "Everyone pays the same agreed amount per seat."}
            </AppText>
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
              { label: "Women only", desc: "Only women can request a seat" },
              { label: "Students only", desc: "Requires a verified student badge" },
            ].map((o, i) => (
              <ToggleRow key={o.label} label={o.label} desc={o.desc} defaultOn={i === 0} divider={i > 0} />
            ))}
          </View>

          <View style={{ gap: 8 }}>
            <Label>Ride description</Label>
            <Textarea
              placeholder="Anything companions should know — luggage space, music, stops…"
              defaultValue="Direct route, one quick stop at the toll. Booking on Uber at 08:05 sharp."
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
            <Button style={{ flex: 1, height: 52, borderRadius: radius.lg }} onPress={publish}>
              <AppText size="base" weight={600} color={colors.primaryForeground}>
                Publish
              </AppText>
            </Button>
          </View>
        </ScrollView>
      </Screen>

      <Dialog visible={previewOpen} onClose={() => setPreviewOpen(false)} title="Ride preview">
        <View style={{ gap: 16 }}>
          <RouteLine
            pickup={pickup}
            destination={destination}
            landmark="Beside the blue coffee kiosk"
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              ["Departs", "08:15"],
              ["Seats", `${seats}`],
              ["Est. each", money(1450)],
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
              publish();
            }}
          >
            <AppText size="sm" weight={600} color={colors.primaryForeground}>
              Publish ride
            </AppText>
          </Button>
        </View>
      </Dialog>
    </PhoneShell>
  );
}
