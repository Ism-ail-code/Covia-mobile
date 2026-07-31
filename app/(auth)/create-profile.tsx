import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import { colors, gradientBrandEnd, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";

const prefs = ["Quiet ride", "Music ok", "Women only", "Students", "Early bird", "Luggage ok"];

export default function CreateProfile() {
  const router = useRouter();
  const { profile, user, updateProfilePatch, busy } = useAuth();
  const [displayName, setDisplayName] = useState(
    profile?.displayName ?? user?.user_metadata?.full_name ?? "",
  );
  const [homeCity, setHomeCity] = useState(profile?.homeCity ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(prefs.slice(0, 2)));
  const [error, setError] = useState<string | null>(null);

  const toggle = (p: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const initials = (displayName || user?.email || "?").slice(0, 2).toUpperCase();

  const handleFinish = async () => {
    if (!displayName.trim()) {
      setError("Give yourself a display name.");
      return;
    }
    setError(null);
    try {
      await updateProfilePatch({
        displayName: displayName.trim(),
        homeCity: homeCity.trim() || null,
        bio: bio.trim() || null,
      });
      router.replace("/home");
    } catch (err) {
      setError("Couldn't save your profile right now. Please try again.");
    }
  };

  return (
    <PhoneShell>
      <TopBar title="Create profile" subtitle="Step 3 of 3 — About you" back />
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Progress value={100} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Screen>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: "center", gap: 12 }}>
              <View>
                <Avatar
                  src={profile?.avatarUrl ?? null}
                  fallback={initials}
                  size={96}
                  ring={{ color: colors.primarySoft, width: 4 }}
                  alt="Your profile photo"
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    height: 32,
                    width: 32,
                    borderRadius: 999,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    ...shadows.soft,
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary, gradientBrandEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}
                  >
                    <Camera size={16} color={colors.primaryForeground} />
                  </LinearGradient>
                </View>
              </View>
              <AppText size="xs" color={colors.mutedForeground}>
                Clear face photos get approved 3x faster
              </AppText>
            </View>

            <View style={{ gap: 8 }}>
              <Label>Display name</Label>
              <Input
                style={{ height: 48, borderRadius: radius.lg, backgroundColor: colors.background }}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Label>Home city</Label>
              <Input
                style={{ height: 48, borderRadius: radius.lg, backgroundColor: colors.background }}
                placeholder="Lagos, Nigeria"
                value={homeCity}
                onChangeText={setHomeCity}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Label>Short bio</Label>
              <Textarea
                value={bio}
                onChangeText={setBio}
                placeholder="A few words about you…"
                style={{ borderRadius: radius.lg, backgroundColor: colors.background, minHeight: 84 }}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Label>Travel preferences</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {prefs.map((p) => (
                  <Chip key={p} active={selected.has(p)} onPress={() => toggle(p)}>
                    {p}
                  </Chip>
                ))}
              </View>
            </View>

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
              onPress={handleFinish}
            >
              <AppText size="base" weight={600} color={colors.primaryForeground}>
                {busy ? "Saving…" : "Finish setup"}
              </AppText>
            </Button>
          </ScrollView>
        </Screen>
      </KeyboardAvoidingView>
    </PhoneShell>
  );
}
