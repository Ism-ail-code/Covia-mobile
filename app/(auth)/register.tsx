import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { User, Mail, Phone, Lock, type LucideIcon } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { OrDivider } from "@/components/ui/OrDivider";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import { RiseIn } from "@/components/ui/animations";
import { useAuth, authErrorMessage } from "@/context/AuthContext";
import { isValidEmail, validatePassword, validatePhone } from "@/lib/validation";
import { homeRouteForStep } from "@/lib/onboarding";

const fields: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  placeholder: string;
  type: "text" | "email" | "phone" | "password";
  hint?: string;
}> = [
  { id: "name", label: "Full name", icon: User, placeholder: "Amina Yusuf", type: "text" },
  { id: "email", label: "Email", icon: Mail, placeholder: "you@example.com", type: "email" },
  {
    id: "phone",
    label: "Phone number",
    icon: Phone,
    placeholder: "+234 800 000 0000",
    type: "phone",
    hint: "For contact and future features only — it is never verified.",
  },
  { id: "password", label: "Password", icon: Lock, placeholder: "At least 8 characters", type: "password" },
];

export default function Register() {
  const router = useRouter();
  const { signUp, signInWithGoogle, busy, onboardingStep } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  const setField = (id: string, value: string) =>
    setValues((prev) => ({ ...prev, [id]: value }));

  const handleGoogle = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      const { cancelled } = await signInWithGoogle();
      if (cancelled) return;
      router.replace(homeRouteForStep(onboardingStep));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleSubmit = async () => {
    const name = (values.name ?? "").trim();
    const email = (values.email ?? "").trim();
    const phone = (values.phone ?? "").trim();
    const password = values.password ?? "";

    if (!name) {
      setError("Enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }

    setError(null);
    try {
      const { sessionCreated } = await signUp({
        email,
        password,
        fullName: name,
        phone,
      });
      if (sessionCreated) {
        // Confirmation is off — start the onboarding lifecycle straight away.
        router.replace(homeRouteForStep(onboardingStep));
      } else {
        // Email confirmation is enabled — the profile is created via the
        // DB trigger once the account exists; the user verifies by email.
        // The email is forwarded so the verify screen can re-send the link
        // even before a session exists (PKCE flow).
        router.replace({ pathname: "/verify", params: { email, from: "signup" } });
      }
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <PhoneShell>
      <TopBar title="Create account" subtitle="Step 1 of 3 — Your details" back />
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Progress value={33} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <RiseIn style={{ gap: 16 }}>
              <GoogleButton onPress={handleGoogle} loading={googleBusy} />
              <OrDivider />
            </RiseIn>
            {fields.map(({ id, label, icon: Icon, placeholder, type, hint }) => (
              <View key={id} style={{ gap: 6 }}>
                <FormField
                  label={label}
                  icon={<Icon size={16} color={colors.mutedForeground} />}
                  placeholder={placeholder}
                  secureTextEntry={type === "password"}
                  keyboardType={
                    type === "email" ? "email-address" : type === "phone" ? "phone-pad" : "default"
                  }
                  autoCapitalize={type === "text" ? "words" : "none"}
                  value={values[id] ?? ""}
                  onChangeText={(v) => setField(id, v)}
                />
                {hint ? (
                  <AppText size="xs" color={colors.mutedForeground} style={{ lineHeight: 16 }}>
                    {hint}
                  </AppText>
                ) : null}
              </View>
            ))}

            <Pressable
              onPress={() => setAgreed((v) => !v)}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  borderRadius: radius.lg,
                  backgroundColor: colors.secondary,
                  padding: 14,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Checkbox value={agreed} onValueChange={setAgreed} />
              <AppText size="xs" color={colors.mutedForeground} style={{ flex: 1, lineHeight: 18 }}>
                I agree to the Covia Terms of Service, Community Safety Rules and Privacy Policy.
              </AppText>
            </Pressable>

            {error ? (
              <AppText size="xs" color={colors.destructive} style={{ lineHeight: 18 }}>
                {error}
              </AppText>
            ) : null}

            <Button
              block
              size="lg"
              style={{ height: 52, borderRadius: radius.lg, marginTop: 4 }}
              disabled={busy || googleBusy}
              onPress={handleSubmit}
            >
              <AppText size="base" weight={600} color={colors.primaryForeground}>
                {busy ? "Creating account…" : "Continue"}
              </AppText>
            </Button>

            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "baseline" }}>
              <AppText size="sm" color={colors.mutedForeground}>
                Already registered?{" "}
              </AppText>
              <Pressable onPress={() => router.push("/login")}>
                <AppText size="sm" weight={600} color={colors.primary}>
                  Log in
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </PhoneShell>
  );
}
