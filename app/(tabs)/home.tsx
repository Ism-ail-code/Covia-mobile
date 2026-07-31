import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Search,
  MapPin,
  Plus,
  Compass,
  ShieldCheck,
  Clock,
  ChevronRight,
  Lightbulb,
  type LucideIcon,
} from "lucide-react-native";
import { colors, gradientBrandEnd, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, SectionHeader } from "@/components/app/PhoneShell";
import { RideCard } from "@/components/app/RideCard";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { PulseDot } from "@/components/ui/animations";
import { currentUser, rides, safetyTips, money } from "@/data/mock";

const quick: Array<{ label: string; icon: LucideIcon; to: "/create" | "/explore" | "/safety" | "/activity" }> = [
  { label: "Create ride", icon: Plus, to: "/create" },
  { label: "Browse", icon: Compass, to: "/explore" },
  { label: "Safety", icon: ShieldCheck, to: "/safety" },
  { label: "Activity", icon: Clock, to: "/activity" },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = rides.find((r) => r.status === "active")!;

  return (
    <PhoneShell>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" }}>
          <LinearGradient
            colors={[colors.primary, gradientBrandEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: insets.top + 28, paddingBottom: 32, paddingHorizontal: gutter }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable onPress={() => router.push("/profile")}>
                <Avatar
                  src={currentUser.photo}
                  fallback={currentUser.initials}
                  size={44}
                  ring={{ color: `${colors.primaryForeground}66` }}
                  alt={currentUser.name}
                />
              </Pressable>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText size="xs" color={`${colors.primaryForeground}CC`}>
                  Good morning
                </AppText>
                <AppText
                  size="lg"
                  family="display"
                  weight={700}
                  color={colors.primaryForeground}
                  numberOfLines={1}
                >
                  {currentUser.name.split(" ")[0]}
                </AppText>
              </View>
              <Pressable
                accessibilityLabel="Notifications"
                onPress={() => router.push("/notifications")}
                style={({ pressed }) => [
                  {
                    height: 40,
                    width: 40,
                    borderRadius: radius.full,
                    backgroundColor: `${colors.primaryForeground}26`,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Bell size={20} color={colors.primaryForeground} />
                <View
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    height: 8,
                    width: 8,
                    borderRadius: 999,
                    backgroundColor: colors.warning,
                  }}
                />
              </Pressable>
            </View>

            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MapPin size={14} color={`${colors.primaryForeground}D9`} />
              <AppText size="xs" color={`${colors.primaryForeground}D9`}>
                Lekki Phase 1, Lagos
              </AppText>
            </View>

            <Pressable
              onPress={() => router.push("/explore")}
              style={({ pressed }) => [
                {
                  marginTop: 16,
                  height: 52,
                  borderRadius: radius.lg,
                  backgroundColor: colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  ...shadows.lifted,
                  opacity: pressed ? 0.95 : 1,
                },
              ]}
            >
              <Search size={18} color={colors.mutedForeground} />
              <AppText size="sm" color={colors.mutedForeground}>
                Where are you heading?
              </AppText>
            </Pressable>
          </LinearGradient>
        </View>

        <View
          style={{
            marginTop: -20,
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: gutter,
          }}
        >
          {quick.map(({ label, icon: Icon, to }) => (
            <Pressable
              key={label}
              onPress={() => router.push(to)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  alignItems: "center",
                  gap: 6,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  paddingVertical: 12,
                  ...shadows.soft,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Icon size={20} color={colors.primary} />
              <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ fontSize: 10 }}>
                {label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Active ride"
            action={
              <Pressable onPress={() => router.push("/live")}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  Track live
                </AppText>
              </Pressable>
            }
          />
          <View style={{ paddingHorizontal: gutter }}>
            <Pressable
              onPress={() => router.push("/live")}
              style={({ pressed }) => [
                {
                  borderRadius: radius["2xl"],
                  borderWidth: 1,
                  borderColor: `${colors.success}40`,
                  backgroundColor: colors.successSoft,
                  padding: 16,
                  ...shadows.soft,
                  opacity: pressed ? 0.95 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <PulseDot size={8} color={colors.success} ringDistance={12} />
                <AppText size="xs" weight={600} color={colors.success}>
                  In progress · arriving 09:24
                </AppText>
              </View>
              <AppText size="base" family="display" weight={700} style={{ marginTop: 8 }}>
                {active.destination}
              </AppText>
              <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 2 }}>
                {active.host.name} hosting · {active.passengers.length + 1} companions ·{" "}
                {money(active.fare)} each
              </AppText>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Nearby rides"
            action={
              <Pressable onPress={() => router.push("/explore")}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  See all
                </AppText>
              </Pressable>
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: gutter, gap: 12, paddingBottom: 8 }}
          >
            {rides.slice(0, 3).map((r) => (
              <View key={r.id} style={{ width: 300 }}>
                <RideCard ride={r} />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginTop: 28 }}>
          <SectionHeader title="Recommended for you" />
          <View style={{ paddingHorizontal: gutter, gap: 12 }}>
            {rides.slice(2, 4).map((r) => (
              <RideCard key={r.id} ride={r} />
            ))}
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <SectionHeader title="Recent activity" />
          <View
            style={{
              marginHorizontal: gutter,
              borderRadius: radius["2xl"],
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              overflow: "hidden",
            }}
          >
            {[
              { t: "Ride completed to Ikoyi", s: "Fare split ₦2,100 · 3 companions", w: "Yesterday" },
              { t: "You rated Sara Mensah", s: "5 stars · “Very punctual”", w: "Yesterday" },
              { t: "Verification approved", s: "Government ID confirmed", w: "2 days ago" },
            ].map((a, i) => (
              <Pressable
                key={a.t}
                onPress={() => router.push("/activity")}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 16,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText size="sm" weight={500} numberOfLines={1}>
                    {a.t}
                  </AppText>
                  <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>
                    {a.s}
                  </AppText>
                </View>
                <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                  {a.w}
                </AppText>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <SectionHeader
            title="Safety tips"
            action={
              <Pressable onPress={() => router.push("/safety")}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  Safety centre
                </AppText>
              </Pressable>
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: gutter, gap: 12, paddingBottom: 8 }}
          >
            {safetyTips.map((tip) => (
              <View
                key={tip}
                style={{
                  width: 240,
                  borderRadius: radius["2xl"],
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  padding: 16,
                  ...shadows.soft,
                }}
              >
                <Lightbulb size={20} color={colors.warning} />
                <AppText
                  size="xs"
                  color={colors.mutedForeground}
                  style={{ marginTop: 8, lineHeight: 18 }}
                >
                  {tip}
                </AppText>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginTop: 28, paddingHorizontal: gutter, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip>Verified community</Chip>
            <Chip>No drivers, no vehicles</Chip>
            <Chip>Fares split fairly</Chip>
          </View>
        </View>
      </ScrollView>
    </PhoneShell>
  );
}
