import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, MailCheck } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { StatusBanner } from "@/components/app/EmptyState";
import { ScaleIn } from "@/components/ui/animations";
import { useAuth, authErrorMessage } from "@/context/AuthContext";
import { homeRouteForStep } from "@/lib/onboarding";
import { LinearGradient } from "expo-linear-gradient";

const RESEND_COOLDOWN = 60;

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const first = local.slice(0, 2);
  const rest = local.slice(2).replace(/./g, "•");
  return `${first}${rest}@${domain}`;
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Verify() {
  const router = useRouter();
  const { email: emailParam, from } = useLocalSearchParams<{ email?: string; from?: string }>();
  const { profile, user, emailVerified, sendOtp, verifyOtpEmail, busy } = useAuth();
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"idle" | "verifying" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const autoSentRef = useRef(false);

  // After a fresh signup there is no session yet (PKCE), so the email is
  // forwarded from the register screen via route params.
  const email = user?.email ?? emailParam ?? "";

  // Safety net: the legacy confirmation deep link still works — if it is
  // exchanged, the session becomes verified and we continue from here.
  useEffect(() => {
    if (emailVerified) {
      router.replace(from === "signup" ? "/onboard" : "/home");
    }
  }, [emailVerified, router, from]);

  const sendCode = useCallback(
    async (auto: boolean) => {
      setError(null);
      if (auto) setPhase("idle");
      try {
        await sendOtp(email);
        setCountdown(RESEND_COOLDOWN);
      } catch (err) {
        // If the code never went out (e.g. rate limit), don't lock the
        // resend button behind a phantom countdown.
        setCountdown(0);
        setError(authErrorMessage(err));
      }
    },
    [email, sendOtp],
  );

  // Send the first code automatically once the screen appears.
  useEffect(() => {
    if (autoSentRef.current || !email) return;
    autoSentRef.current = true;
    void sendCode(true);
  }, [email, sendCode]);

  // Countdown for the resend button.
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const canResend = countdown <= 0 && !busy;

  const handleVerify = async (token: string) => {
    if (phase === "verifying") return;
    setError(null);
    setPhase("verifying");
    try {
      await verifyOtpEmail(email, token);
      setPhase("success");
      setTimeout(() => {
        // Fresh signups start the onboarding lifecycle at /onboard; everyone
        // else resumes wherever their profile row says they left off.
        router.replace(
          from === "signup" ? "/onboard" : homeRouteForStep(profile?.onboardingStep ?? "complete"),
        );
      }, 1100);
    } catch (err) {
      setError(authErrorMessage(err));
      setCode("");
      setPhase("idle");
    }
  };

  return (
    <PhoneShell>
      <TopBar title="Verify your email" subtitle="Step 2 of 3 — Contact check" back />
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Progress value={66} />
      </View>
      <Screen>
        {phase === "success" ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 32 }}>
            <ScaleIn>
              <View
                style={{
                  height: 96,
                  width: 96,
                  borderRadius: 999,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  ...shadows.lifted,
                }}
              >
                <LinearGradient
                  colors={[colors.success, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}
                >
                  <Check size={44} color="#ffffff" strokeWidth={3} />
                </LinearGradient>
              </View>
            </ScaleIn>
            <AppText size="xl" family="display" weight={800} style={{ textAlign: "center" }}>
              Email verified
            </AppText>
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center" }}>
              Your account is active — setting things up…
            </AppText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: 16 }}>
              <StatusBanner
                tone="info"
                title="Enter your 6-digit code"
                body={`We sent a verification code to ${email ? maskEmail(email) : "your email"}. It expires in 1 hour.`}
              />
              {error ? (
                <AppText size="xs" color={colors.destructive} style={{ lineHeight: 18 }}>
                  {error}
                </AppText>
              ) : null}
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={handleVerify}
                disabled={busy}
                hasError={Boolean(error)}
              />
              <View style={{ alignItems: "center", gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                  <MailCheck size={13} color={colors.mutedForeground} />
                  <AppText size="xs" color={colors.mutedForeground}>
                    Didn't get it?
                  </AppText>
                </View>
                {canResend ? (
                  <Pressable onPress={() => void sendCode(false)} hitSlop={8}>
                    <AppText size="xs" weight={700} color={colors.primary}>
                      Resend code
                    </AppText>
                  </Pressable>
                ) : (
                  <AppText size="xs" weight={600} color={colors.mutedForeground}>
                    Resend available in {formatCountdown(countdown)}
                  </AppText>
                )}
              </View>
            </View>
          </ScrollView>
        )}
      </Screen>
      {phase !== "success" ? (
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
            <Button
              block
              size="lg"
              style={{ height: 52, borderRadius: radius.lg }}
              disabled={!canResend}
              onPress={() => void sendCode(false)}
            >
              <AppText size="base" weight={600} color={colors.primaryForeground}>
                {canResend ? "Send a new code" : `Resend code in ${formatCountdown(countdown)}`}
              </AppText>
            </Button>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </PhoneShell>
  );
}
