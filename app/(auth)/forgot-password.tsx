import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Mail, ArrowRight } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/app/EmptyState";
import { RiseIn } from "@/components/ui/animations";
import { useAuth, authErrorMessage } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/validation";

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword, busy } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  if (sent) {
    return (
      <PhoneShell>
        <TopBar title="Reset password" subtitle="We'll send you a secure link" back />
        <Screen>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 20 }}>
            <StatusBanner
              tone="success"
              title="Check your inbox"
              body="If an account exists for that email, a reset link is on its way. It expires after 15 minutes."
            />
            <Button
              block
              size="lg"
              style={{ height: 52, borderRadius: radius.lg }}
              onPress={() => router.push("/login")}
            >
              <AppText size="base" weight={600} color={colors.primaryForeground}>
                Back to log in
              </AppText>
            </Button>
          </ScrollView>
        </Screen>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <TopBar title="Reset password" subtitle="We'll send you a secure link" back />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 20 }}>
            <RiseIn style={{ gap: 20 }}>
              <FormField
                label="Email address"
                icon={<Mail size={16} color={colors.mutedForeground} />}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              {error ? (
                <AppText size="xs" color={colors.destructive} style={{ lineHeight: 18 }}>
                  {error}
                </AppText>
              ) : null}
              <Button
                block
                size="lg"
                style={{ height: 52, borderRadius: radius.lg }}
                disabled={busy}
                onPress={handleSubmit}
              >
                <AppText size="base" weight={600} color={colors.primaryForeground}>
                  {busy ? "Sending…" : "Send reset link"}
                </AppText>
                <ArrowRight size={16} color={colors.primaryForeground} />
              </Button>
            </RiseIn>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </PhoneShell>
  );
}
