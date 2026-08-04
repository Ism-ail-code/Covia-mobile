import { useState } from "react";
import { Pressable, ScrollView, TextInput, View, Image } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Bug,
  Lightbulb,
  Palette,
  MessageSquare,
  Send,
  Camera,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { submitFeedback, type FeedbackCategory } from "@/lib/feedback";
import { getVersionInfo, formatVersion } from "@/lib/version";
import { diagnosticsToString, collectDiagnostics } from "@/lib/diagnostics";
import { track } from "@/lib/analytics";

const categories: Array<{ key: FeedbackCategory; label: string; icon: typeof Bug; description: string }> = [
  { key: "bug", label: "Bug Report", icon: Bug, description: "Something isn't working" },
  { key: "feature", label: "Feature Request", icon: Lightbulb, description: "Suggest an improvement" },
  { key: "ui_issue", label: "UI Issue", icon: Palette, description: "Something looks wrong" },
  { key: "general", label: "General Feedback", icon: MessageSquare, description: "Any other thoughts" },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pickScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!category || !description.trim()) {
      toast.error("Please select a category and describe your feedback.");
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({
        category,
        description: description.trim(),
        screenshotUri: screenshot ?? undefined,
        userId: user?.id,
      });
      track("feedback_submitted", { category });
      setSubmitted(true);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PhoneShell>
        <TopBar title="Feedback" back onBack={() => router.back()} />
        <Screen>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
            <CheckCircle2 size={48} color={colors.success} />
            <AppText size="lg" weight={700}>
              Thank you!
            </AppText>
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center" }}>
              Your feedback helps us improve Covia. We review every submission.
            </AppText>
            <Button
              variant="outline"
              style={{ marginTop: 8, height: 44, borderRadius: radius.lg }}
              onPress={() => router.back()}
            >
              <AppText size="sm" weight={600} color={colors.primary}>Done</AppText>
            </Button>
          </View>
        </Screen>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <TopBar title="Send Feedback" back onBack={() => router.back()} />
      <Screen>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Category
            </AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {categories.map(({ key, label, icon: Icon, description: desc }) => (
                <Pressable
                  key={key}
                  onPress={() => setCategory(key)}
                  accessibilityLabel={label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === key }}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      minWidth: "45%",
                      padding: 12,
                      borderRadius: radius.lg,
                      borderWidth: 1.5,
                      borderColor: category === key ? colors.primary : colors.border,
                      backgroundColor: category === key ? colors.primarySoft : colors.card,
                      opacity: pressed ? 0.9 : 1,
                      gap: 4,
                    },
                  ]}
                >
                  <Icon size={18} color={category === key ? colors.primary : colors.mutedForeground} />
                  <AppText size="sm" weight={600} color={category === key ? colors.primary : colors.foreground}>
                    {label}
                  </AppText>
                  <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>
                    {desc}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Description
            </AppText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened, what you expected, or your idea..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: 120,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                padding: 14,
                fontSize: 14,
                color: colors.foreground,
              }}
            />
          </View>

          <View>
            <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Screenshot (optional)
            </AppText>
            {screenshot ? (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: screenshot }}
                  style={{ width: "100%", height: 160, borderRadius: radius.lg }}
                  resizeMode="cover"
                  accessibilityLabel="Screenshot preview"
                />
                <Pressable
                  onPress={() => setScreenshot(null)}
                  accessibilityLabel="Remove screenshot"
                  accessibilityRole="button"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    height: 28,
                    width: 28,
                    borderRadius: 14,
                    backgroundColor: colors.overlay,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickScreenshot}
                accessibilityLabel="Add screenshot"
                accessibilityRole="button"
                style={({ pressed }) => ({
                  height: 80,
                  borderRadius: radius.lg,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Camera size={20} color={colors.mutedForeground} />
                <AppText size="xs" color={colors.mutedForeground}>Tap to add screenshot</AppText>
              </Pressable>
            )}
          </View>

          <Button
            block
            style={{ height: 52, borderRadius: radius.lg }}
            disabled={!category || !description.trim() || submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <Loader2 size={18} color={colors.primaryForeground} />
            ) : (
              <Send size={18} color={colors.primaryForeground} />
            )}
            <AppText size="sm" weight={600} color={colors.primaryForeground}>
              {submitting ? "Sending…" : "Submit Feedback"}
            </AppText>
          </Button>
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
