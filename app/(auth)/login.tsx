import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, Lock, Eye } from "lucide-react-native";
import { colors } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useAuth, authErrorMessage } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/validation";

export default function Login() {
  const router = useRouter();
  const { signIn, busy } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const failedAttemptsRef = useRef(0);
  const lastAttemptRef = useRef(0);

  const canSubmit = isValidEmail(email) && password.length > 0 && !busy;

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!isValidEmail(email)) {
        setError("Enter a valid email address.");
        return;
      }
      if (!password) {
        setError("Enter your password.");
        return;
      }
      return;
    }

    const now = Date.now();
    const elapsed = now - lastAttemptRef.current;
    const minDelay = Math.min(1000 * Math.pow(2, failedAttemptsRef.current), 30000);
    if (elapsed < minDelay) {
      setError(`Too many attempts. Wait ${Math.ceil((minDelay - elapsed) / 1000)} seconds.`);
      return;
    }

    setError(null);
    lastAttemptRef.current = now;
    try {
      const user = await signIn(email, password);
      failedAttemptsRef.current = 0;
      if (!user.email_confirmed_at) {
        router.replace("/verify");
      } else {
        router.replace("/home");
      }
    } catch (err) {
      failedAttemptsRef.current += 1;
      setError(authErrorMessage(err));
    }
  };

  return (
    <PhoneShell>
      <TopBar title="Welcome back" subtitle="Log in to continue" back />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <FormField
              label="Email"
              icon={<Mail size={16} color={colors.mutedForeground} />}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <FormField
              label="Password"
              icon={<Lock size={16} color={colors.mutedForeground} />}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              rightIcon={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityRole="button"
                >
                  <Eye size={16} color={colors.mutedForeground} />
                </Pressable>
              }
            />
            <View style={{ alignItems: "flex-end" }}>
              <Pressable onPress={() => router.push("/forgot-password")}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  Forgot password?
                </AppText>
              </Pressable>
            </View>
            {error ? (
              <AppText size="xs" color={colors.destructive} style={{ lineHeight: 18 }}>
                {error}
              </AppText>
            ) : null}
            <Button
              size="lg"
              block
              style={{ height: 52, borderRadius: 16 }}
              textStyle={{ fontSize: 16, fontWeight: "600" }}
              disabled={busy}
              onPress={handleSubmit}
            >
              <AppText size="base" weight={600} color={colors.primaryForeground}>
                {busy ? "Logging in…" : "Log in"}
              </AppText>
            </Button>
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "baseline" }}>
              <AppText size="sm" color={colors.mutedForeground}>
                New to Covia?{" "}
              </AppText>
              <Pressable onPress={() => router.push("/register")}>
                <AppText size="sm" weight={600} color={colors.primary}>
                  Create an account
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </PhoneShell>
  );
}
