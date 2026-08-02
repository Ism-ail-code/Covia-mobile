import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/theme";
import { useAuth } from "@/context/AuthContext";

/**
 * Admin console group. Double-gated: the root `Stack.Protected` already
 * requires a verified session; this layout additionally requires the
 * signed-in user to hold an admin role (`is_admin` RPC — returns false
 * for regular members, no error).
 */
export default function AdminLayout() {
  const router = useRouter();
  const { status, isAdmin } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && isAdmin === false) {
      router.replace("/");
    }
  }, [status, isAdmin, router]);

  const ready = status === "authenticated" && isAdmin === true;
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="users/[userId]" />
      <Stack.Screen name="rides" />
      <Stack.Screen name="rides/[rideId]" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="verification/[submissionId]" />
      <Stack.Screen name="more" />
    </Stack>
  );
}
