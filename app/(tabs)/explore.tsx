import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Search, SlidersHorizontal, MapPin } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { RideCard } from "@/components/app/RideCard";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/app/EmptyState";
import { Stagger } from "@/components/ui/animations";
import { rides } from "@/data/mock";

const filters = ["All", "Today", "Women only", "Students", "Under ₦1,500", "Near me"];

export default function Explore() {
  const [active, setActive] = useState("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [maxFare, setMaxFare] = useState(2500);
  const [maxKm, setMaxKm] = useState(3);

  const list = useMemo(() => {
    if (active === "Women only") return rides.filter((r) => r.tags.includes("Women only"));
    if (active === "Students") return rides.filter((r) => r.tags.includes("Students"));
    if (active === "Under ₦1,500") return rides.filter((r) => r.fare < 1500);
    return rides.filter((r) => r.status !== "cancelled");
  }, [active]);

  return (
    <PhoneShell>
      <Screen>
        <TopBar
          title="Explore rides"
          subtitle="42 companions travelling near you"
          action={
            <IconButton accessibilityLabel="Filters" onPress={() => setSheetOpen(true)}>
              <SlidersHorizontal size={18} color={colors.secondaryForeground} />
            </IconButton>
          }
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: gutter, paddingTop: 16 }}>
            <Input
              icon={<Search size={16} color={colors.mutedForeground} />}
              placeholder="Search destination or landmark"
              containerStyle={{ minHeight: 48 }}
              style={{
                height: 48,
                borderRadius: radius.lg,
                backgroundColor: colors.card,
                paddingLeft: 40,
                ...shadows.soft,
              }}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 16, gap: 8 }}
          >
            {filters.map((f) => (
              <Chip key={f} active={active === f} onPress={() => setActive(f)}>
                {f}
              </Chip>
            ))}
          </ScrollView>

          {list.length ? (
            <View style={{ paddingHorizontal: gutter, gap: 12 }}>
              {list.map((r, i) => (
                <Stagger key={r.id} index={i}>
                  <RideCard ride={r} />
                </Stagger>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<MapPin size={28} color={colors.primary} />}
              title="No rides match yet"
              body="Try widening your filters, or create a ride and let companions come to you."
            />
          )}
        </ScrollView>
      </Screen>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 24 }}
      >
        <View style={{ gap: 8 }}>
          <Label>Destination</Label>
          <Input
            placeholder="e.g. Victoria Island"
            containerStyle={{ minHeight: 48 }}
            style={{ height: 48, borderRadius: radius.lg }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Label>Date</Label>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["Today", "Tomorrow", "This week"].map((d, i) => (
              <Chip key={d} active={i === 0}>
                {d}
              </Chip>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Label>Preference</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["Any", "Women only", "Students only"].map((d, i) => (
              <Chip key={d} active={i === 0}>
                {d}
              </Chip>
            ))}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Label>Max fare per seat — ₦{maxFare.toLocaleString()}</Label>
          <Slider value={maxFare} minimumValue={500} maximumValue={5000} step={100} onValueChange={setMaxFare} />
        </View>

        <View style={{ gap: 12 }}>
          <Label>Pickup within {maxKm} km</Label>
          <Slider value={maxKm} minimumValue={1} maximumValue={15} step={1} onValueChange={setMaxKm} />
        </View>

        <Button
          block
          style={{ height: 52, borderRadius: radius.lg }}
          onPress={() => setSheetOpen(false)}
        >
          <AppText size="base" weight={600} color={colors.primaryForeground}>
            Show {list.length} rides
          </AppText>
        </Button>
      </BottomSheet>
    </PhoneShell>
  );
}
