import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/app/EmptyState";
import { useAuth, authErrorMessage } from "@/context/AuthContext";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const first = local.slice(0, 2);
  const rest = local.slice(2).replace(/./g, "•");
  return `${first}${rest}@${domain}`;
}

export default function Verify() {
  const router = useRouter();
  const { email: emailParam, from } = useLocalSearchParams<{ email?: string; from?: string }>();
  const { user, emailVerified, resendVerification, busy } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  // After a fresh signup there is no session yet (PKCE), so the email is
  // forwarded from the register screen via route params.
  const email = user?.email ?? emailParam ?? "";

  // Once the confirmation deep link is exchanged, the session becomes
  // verified. New signups continue to step 3 (profile setup); returning
  // users head straight home.
  useEffect(() => {
    if (emailVerified) {
      router.replace(from === "signup" ? "/create-profile" : "/home");
    }
  }, [emailVerified, router, from]);

  const handleResend = async () => {
    setError(null);
    setResent(false);
    try {
      await resendVerification(email || undefined, from === "signup");
      setResent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <PhoneShell>
      <TopBar title="Verify your email" subtitle="Step 2 of 3 — Contact check" back />
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Progress value={66} />
      </View>
      <Screen>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 24 }}>
          <View style={{ gap: 16 }}>
            <StatusBanner
              tone="info"
              title="Confirm your email address"
              body={`We sent a verification link to ${email ? maskEmail(email) : "your email"}. Tap it to activate your account.`}
            />
            {resent ? (
              <StatusBanner tone="success" title="Email re-sent" body="Check your inbox again — the link expires in 15 minutes." />
            ) : null}
            {error ? (
              <AppText size="xs" color={colors.destructive} style={{ lineHeight: 18 }}>
                {error}
              </AppText>
            ) : null}
            <View style={{ alignItems: "center", gap: 16 }}>
              <AppText size="xs" color={colors.mutedForeground}>
                Didn't get it?{" "}
                <Pressable onPress={handleResend} disabled={busy}>
                  <AppText size="xs" weight={600} color={colors.primary}>
                    {busy ? "Resending…" : "Resend email"}
                  </AppText>
                </Pressable>
              </AppText>
            </View>
          </View>
        </ScrollView>
      </Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
            paddingHorizontal: 20,
            paddingVertical: 20,
          }}
        >
          <Button block size="lg" style={{ height: 52, borderRadius: radius.lg }} onPress={handleResend}>
            <AppText size="base" weight={600} color={colors.primaryForeground}>
              {busy ? "Sending…" : "Resend verification email"}
            </AppText>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </PhoneShell>
  );
}
