import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
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
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import { uploadAvatar, validateAvatar } from "@/services/storage";
import { validatePhone, validateUsername } from "@/lib/validation";
import { useToast } from "@/components/ui/Toast";
import { Chip } from "@/components/ui/Chip";
import { GENDERS, type Gender } from "@/types/profile";

export default function CreateProfile() {
  const router = useRouter();
  const toast = useToast();
  const { profile, user, updateProfilePatch, setOnboardingStep, busy } = useAuth();
  // Flow mode is driven by the persisted onboarding step, not a route
  // param — so reinstalls and app restarts resume exactly where they
  // left off (migration 0044).
  const isSignupStep = profile?.onboardingStep === "profile";
  const [displayName, setDisplayName] = useState(
    profile?.displayName ?? user?.user_metadata?.full_name ?? "",
  );
  const [username, setUsername] = useState(profile?.username ?? "");
  const [phone, setPhone] = useState(
    profile?.phone ?? user?.user_metadata?.phone ?? "",
  );
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth ?? "");
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [homeCity, setHomeCity] = useState(profile?.homeCity ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials = (displayName || user?.email || "?").slice(0, 2).toUpperCase();

  const pickAvatar = useCallback(async () => {
    if (!user) return;
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Allow photo access to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const validationError = validateAvatar(asset);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatar(user.id, asset, profile?.avatarUrl ?? null);
      await updateProfilePatch({ avatarUrl: publicUrl });
      toast.success("Profile photo updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed — please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  }, [user, profile, updateProfilePatch, toast]);

  const handleFinish = async () => {
    if (!displayName.trim()) {
      setError("Give yourself a display name.");
      return;
    }
    const usernameError = username.trim() ? validateUsername(username) : null;
    if (usernameError) {
      setError(usernameError);
      return;
    }
    const phoneError = phone.trim() ? validatePhone(phone) : null;
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (dateOfBirth.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      setError("Enter your date of birth as yyyy-mm-dd.");
      return;
    }
    if (dateOfBirth.trim() && new Date(dateOfBirth.trim()).toString() === "Invalid Date") {
      setError("That date of birth doesn't look right.");
      return;
    }
    setError(null);
    try {
      await updateProfilePatch({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase() || null,
        phone: phone.trim() || null,
        dateOfBirth: dateOfBirth.trim() || null,
        gender,
        homeCity: homeCity.trim() || null,
        country: country.trim() || null,
        bio: bio.trim() || null,
      });
      if (isSignupStep) {
        // Onboarding lifecycle: profile done → identity verification intro.
        await setOnboardingStep("verify");
        router.replace({ pathname: "/verification", params: { from: "flow" } });
      } else {
        router.replace("/home");
      }    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("taken") || message.includes("reserved")) {
        setError(message);
      } else if (message.includes("constraint")) {
        setError("That username isn't available — try another one.");
      } else {
        setError("Couldn't save your profile right now. Please try again.");
      }
    }
  };

  return (
    <PhoneShell>
      <TopBar
        title={isSignupStep ? "Create your profile" : "Edit profile"}
        subtitle={isSignupStep ? "Step 2 of 3 — About you" : "About you"}
        back
      />
      {isSignupStep ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Progress value={100} />
        </View>
      ) : null}
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
              <Pressable onPress={pickAvatar} disabled={uploadingAvatar}>
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
              </Pressable>
              <AppText size="xs" color={colors.mutedForeground}>
                {uploadingAvatar ? "Uploading…" : "Tap to add a photo — clear face photos get approved 3x faster"}
              </AppText>
            </View>

            <View style={{ gap: 8 }}>
              <Label>Display name</Label>
              <Input
                style={{ height: 48, borderRadius: radius.lg, backgroundColor: colors.background }}
                placeholder="Amina Yusuf"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Label>Username</Label>
              <Input
                style={{ height: 48, borderRadius: radius.lg, backgroundColor: colors.background }}
                placeholder="amina_yusuf"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
              />
              <AppText size="xs" color={colors.mutedForeground}>
                3–20 characters: lowercase letters, numbers and underscores.
              </AppText>
            </View>
            <View style={{ gap: 8 }}>
              <Label>Phone number</Label>
              <Input
                style={{ height: 48, borderRadius: radius.lg, backgroundColor: colors.background }}
                placeholder="+234 800 000 0000"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <AppText size="xs" color={colors.mutedForeground}>
                For contact and future features only — it is never verified.
              </AppText>
            </View>

            <View style={{ gap: 8 }}>
              <Label>Date of birth</Label>
              <Input
                style={{ height: 48, borderRadius: radius.lg, backgroundColor: colors.background }}
                placeholder="yyyy-mm-dd (optional)"
                autoCapitalize="none"
                autoCorrect={false}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Label>Gender</Label>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {GENDERS.map((option) => (
                  <Chip
                    key={option}
                    active={gender === option}
                    onPress={() => setGender(gender === option ? null : option)}
                  >
                    {option}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, gap: 8 }}>
                <Label>Home city</Label>
                <Input
                  style={{ height: 48, borderRadius: radius.lg, backgroundColor: colors.background }}
                  placeholder="Lagos, Nigeria"
                  value={homeCity}
                  onChangeText={setHomeCity}
                />
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Label>Country</Label>
                <Input
                  style={{ height: 48, borderRadius: radius.lg, backgroundColor: colors.background }}
                  placeholder="Nigeria"
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
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

            {error ? (
              <AppText size="xs" color={colors.destructive} style={{ lineHeight: 18 }}>
                {error}
              </AppText>
            ) : null}

            <Button
              block
              size="lg"
              style={{ height: 52, borderRadius: radius.lg }}
              disabled={busy || uploadingAvatar}
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
