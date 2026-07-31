import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, ArrowRight } from "lucide-react-native";
import { colors, gradientBrandEnd, radius, gutter, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell } from "@/components/app/PhoneShell";
import { RiseIn } from "@/components/ui/animations";
import { LinearGradient } from "expo-linear-gradient";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ height: 6, width: 6, borderRadius: 999, backgroundColor: colors.primary }} />
            <AppText size="xs" weight={600} color={colors.mutedForeground}>
              Companion
            </AppText>
          </View>
          <Pressable onPress={() => router.push("/onboarding")}>
            <AppText size="xs" weight={600} color={colors.mutedForeground}>
              How it works
            </AppText>
          </Pressable>
        </View>

        <RiseIn style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
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
              <Users size={56} color={colors.primaryForeground} strokeWidth={1.6} />
            </LinearGradient>
          </View>
          <AppText size="28" family="display" weight={800} style={{ textAlign: "center", lineHeight: 36 }}>
            Travel together.
            {"\n"}Spend less. Arrive safer.
          </AppText>
          <AppText
            size="sm"
            color={colors.mutedForeground}
            style={{ marginTop: 12, textAlign: "center", lineHeight: 22 }}
          >
            Match with verified people heading your way and share the ride you already book.
          </AppText>
        </RiseIn>

        <View style={{ paddingHorizontal: gutter, paddingBottom: 32 + insets.bottom, gap: 12 }}>
          <Pressable
            onPress={() => router.push("/register")}
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
              Create an account
            </AppText>
            <ArrowRight size={16} color={colors.primaryForeground} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/login")}
            style={({ pressed }) => [
              { height: 44, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <AppText size="sm" color={colors.mutedForeground}>
              I already have an account
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </PhoneShell>
  );
}
