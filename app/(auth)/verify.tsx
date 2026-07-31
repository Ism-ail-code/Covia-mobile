import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { MessageSquare, Mail } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Tabs } from "@/components/ui/Tabs";
import { OTPInput } from "@/components/ui/OTPInput";
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
  const { user, emailVerified, resendVerification, busy } = useAuth();
  const [tab, setTab] = useState<"phone" | "email">("email");
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const email = user?.email ?? "";

  // Once the confirmation deep link is exchanged, the session becomes
  // verified and we can move into the app.
  useEffect(() => {
    if (emailVerified) router.replace("/home");
  }, [emailVerified, router]);

  const handleResend = async () => {
    setError(null);
    setResent(false);
    try {
      await resendVerification();
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
          <Tabs
            columns={2}
            value={tab}
            onChange={setTab}
            tabs={[
              {
                value: "phone",
                label: "Phone",
                icon: (
                  <MessageSquare
                    size={16}
                    color={tab === "phone" ? colors.foreground : colors.mutedForeground}
                  />
                ),
              },
              {
                value: "email",
                label: "Email",
                icon: (
                  <Mail size={16} color={tab === "email" ? colors.foreground : colors.mutedForeground} />
                ),
              },
            ]}
          />

          {tab === "email" ? (
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
          ) : (
            <View style={{ alignItems: "center", gap: 24, paddingTop: 24 }}>
              <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center" }}>
                We sent a 6-digit code to your phone number.
              </AppText>
              <OTPInput length={6} />
              <AppText size="xs" color={colors.mutedForeground}>
                Didn't get it?{" "}
                <AppText size="xs" weight={600} color={colors.primary}>
                  Resend code
                </AppText>
              </AppText>
            </View>
          )}
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
