import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Lock } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/app/EmptyState";
import { useAuth, authErrorMessage } from "@/context/AuthContext";
import { validatePassword } from "@/lib/validation";

export default function ResetPassword() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { busy, resetReady, resetError, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // A reset link carries a PKCE `code` (cold start) or `resetReady` becomes
  // true after the AuthContext exchanges it (warm start). If neither, the
  // user landed here without a valid link.
  const inResetFlow = Boolean(code) || busy || resetReady;

  const handleSubmit = async () => {
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
      await signOut().catch(() => {});
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  if (done) {
    return (
      <PhoneShell>
        <TopBar title="Password updated" subtitle="You're all set" back />
        <Screen>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 20 }}>
            <StatusBanner
              tone="success"
              title="Your password was changed"
              body="Log in again with your new password to continue."
            />
            <Button
              block
              size="lg"
              style={{ height: 52, borderRadius: radius.lg }}
              onPress={() => router.replace("/login")}
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

  if (resetError || !inResetFlow) {
    return (
      <PhoneShell>
        <TopBar title="Reset password" subtitle="Link invalid or expired" back />
        <Screen>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 20 }}>
            <StatusBanner
              tone="danger"
              title="Link expired"
              body={
                resetError ??
                "This reset link is invalid or has expired. Please request a new one."
              }
            />
            <Button
              block
              size="lg"
              style={{ height: 52, borderRadius: radius.lg }}
              onPress={() => router.replace("/forgot-password")}
            >
              <AppText size="base" weight={600} color={colors.primaryForeground}>
                Request a new link
              </AppText>
            </Button>
          </ScrollView>
        </Screen>
      </PhoneShell>
    );
  }

  if (busy && !resetReady) {
    return (
      <PhoneShell>
        <TopBar title="Reset password" subtitle="Verifying your link" />
        <Screen>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
            <ActivityIndicator color={colors.primary} />
            <AppText size="xs" color={colors.mutedForeground}>
              Verifying your link…
            </AppText>
          </View>
        </Screen>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <TopBar title="Reset password" subtitle="Choose a new password" back />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 20 }}>
            <StatusBanner
              tone="info"
              title="One more step"
              body="Enter a new password for your account. It must be at least 8 characters with upper and lowercase letters, a number and a symbol."
            />
            <FormField
              label="New password"
              icon={<Lock size={16} color={colors.mutedForeground} />}
              placeholder="At least 8 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <FormField
              label="Confirm new password"
              icon={<Lock size={16} color={colors.mutedForeground} />}
              placeholder="Repeat your password"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
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
                {busy ? "Saving…" : "Update password"}
              </AppText>
            </Button>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </PhoneShell>
  );
}
