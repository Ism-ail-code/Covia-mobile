import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Users,
  ShieldCheck,
  Wallet,
  MapPin,
  Bell,
  ArrowRight,
  type LucideIcon,
} from "lucide-react-native";
import { colors, gradientBrandEnd, radius, gutter, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell } from "@/components/app/PhoneShell";
import { RiseIn } from "@/components/ui/animations";

const steps: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
  permission?: string;
}> = [
  {
    icon: Users,
    title: "Find people going your way",
    body: "Post your route or browse rides that match your pickup, destination and departure time.",
  },
  {
    icon: ShieldCheck,
    title: "Everyone is verified",
    body: "Government ID and student checks, ratings and reliability scores — before anyone joins.",
  },
  {
    icon: Wallet,
    title: "Book anywhere, split fairly",
    body: "Book the ride on Uber, inDrive or Yango. Covia splits the fare between everyone.",
  },
  {
    icon: MapPin,
    title: "Location access",
    body: "We use your location to show nearby pickup points and share live ride progress with your Covians.",
    permission: "Allow location",
  },
  {
    icon: Bell,
    title: "Stay in the loop",
    body: "Notifications for join requests, approvals, driver arrival and safety check-ins.",
    permission: "Enable notifications",
  },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const step = steps[i];
  const Icon = step.icon;
  const last = i === steps.length - 1;

  const next = () => (last ? router.replace("/verification") : setI(i + 1));

  return (
    <PhoneShell>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: gutter,
            paddingTop: insets.top + 24,
          }}
        >
          <View style={{ flexDirection: "row", gap: 6 }}>
            {steps.map((_, idx) => (
              <View
                key={idx}
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: idx === i ? colors.primary : colors.border,
                  width: idx === i ? 24 : 6,
                }}
              />
            ))}
          </View>
          <Pressable onPress={() => router.replace("/home")}>
            <AppText size="xs" weight={600} color={colors.mutedForeground}>
              Skip
            </AppText>
          </Pressable>
        </View>

        <RiseIn
          key={i}
          style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}
        >
          <View
            style={{
              marginBottom: 32,
              height: 128,
              width: 128,
              borderRadius: 40,
              overflow: "hidden",
              ...shadows.lifted,
            }}
          >
            <LinearGradient
              colors={[colors.primary, gradientBrandEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Icon size={56} color={colors.primaryForeground} strokeWidth={1.6} />
            </LinearGradient>
          </View>
          <AppText size="2xl" family="display" weight={800} style={{ textAlign: "center", lineHeight: 32 }}>
            {step.title}
          </AppText>
          <AppText
            size="sm"
            color={colors.mutedForeground}
            style={{ marginTop: 12, textAlign: "center", lineHeight: 22 }}
          >
            {step.body}
          </AppText>
        </RiseIn>

        <View style={{ paddingHorizontal: gutter, paddingBottom: 32 + insets.bottom, gap: 12 }}>
          <Pressable
            onPress={next}
            style={({ pressed }) => [
              {
                height: 52,
                borderRadius: radius.lg,
                backgroundColor: colors.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <AppText size="base" weight={600} color={colors.primaryForeground}>
              {step.permission ?? (last ? "Get started" : "Continue")}
            </AppText>
            <ArrowRight size={16} color={colors.primaryForeground} />
          </Pressable>
          {step.permission ? (
            <Pressable
              onPress={next}
              style={({ pressed }) => [{ height: 44, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 }]}
            >
              <AppText size="sm" color={colors.mutedForeground}>
                Not now
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </PhoneShell>
  );
}
