import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  MailCheck,
  UserRound,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react-native";
import { colors, gradientBrandEnd, gutter, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell } from "@/components/app/PhoneShell";
import { RiseIn } from "@/components/ui/animations";
import { useAuth } from "@/context/AuthContext";

/**
 * Post-verification welcome. First stop of the onboarding lifecycle
 * (step "onboard"); advances to "profile" on completion. This screen
 * only ever shows to authenticated users whose profile row says they
 * have not started onboarding.
 */
const steps: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: MailCheck,
    title: "You're in!",
    body: "Your email is verified. Let's set up your Covia profile so riders and drivers know who you are.",
  },
  {
    icon: UserRound,
    title: "Tell us about yourself",
    body: "Name, photo and a few details. This only takes a minute and you can change it any time.",
  },
  {
    icon: ShieldCheck,
    title: "Get verified",
    body: "A quick identity check keeps Covia safe. You'll upload your ID, take a selfie, and we review it within 4 hours.",
  },
];

export default function Onboard() {
  const [i, setI] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOnboardingStep } = useAuth();
  const step = steps[i];
  const Icon = step.icon;
  const last = i === steps.length - 1;

  const finish = async () => {
    try {
      await setOnboardingStep("profile");
    } catch {
      // Fall back to the local-only profile step below the wire.
    }
    router.replace("/create-profile");
  };

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
          <Pressable onPress={finish} hitSlop={8}>
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
            onPress={() => (last ? void finish() : setI(i + 1))}
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
              {last ? "Set up my profile" : "Continue"}
            </AppText>
            <ArrowRight size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </ScrollView>
    </PhoneShell>
  );
}
