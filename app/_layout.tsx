import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { status, emailVerified, stepReady, onboardingStep } = useAuth();

  // While the persisted session is being restored, keep the splash visible.
  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  // Never flash the main app before the onboarding step has been read.
  if (status === "loading" || (status === "authenticated" && !stepReady)) {
    return null;
  }

  const canAccessApp = status === "authenticated" && emailVerified;

  // The setup journey (onboarding → profile → verification intro) is its
  // own protected group so unfinished onboarding can never be skipped.
  const inSetup = canAccessApp && onboardingStep !== "complete";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Protected guard={canAccessApp && !inSetup}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="admin" />
      </Stack.Protected>
      <Stack.Protected guard={canAccessApp && inSetup}>
        <Stack.Screen name="(flow)" />
      </Stack.Protected>
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
