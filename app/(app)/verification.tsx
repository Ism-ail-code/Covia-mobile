import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  BadgeCheck,
  GraduationCap,
  Upload,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatusBanner } from "@/components/app/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { ScaleIn } from "@/components/ui/animations";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import {
  GOVERNMENT_ID_KINDS,
  VERIFICATION_TYPES,
  type GovernmentIdKind,
  type VerificationSubmission,
  type VerificationType,
} from "@/types/verification";
import {
  getMyVerification,
  resubmitVerification,
  submitVerification,
  uploadVerificationDocument,
  validateVerificationDocument,
  type DocumentSource,
} from "@/services/verification";

type DocSlot = "front" | "back" | "selfie" | "card";

export default function VerificationScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [activeType, setActiveType] = useState<VerificationType>("government_id");
  const [submissions, setSubmissions] = useState<
    Partial<Record<VerificationType, VerificationSubmission | null>>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [govKind, setGovKind] = useState<GovernmentIdKind>("national_id");
  const [studentMethod, setStudentMethod] = useState<"email" | "card">("card");
  const [universityEmail, setUniversityEmail] = useState("");
  const [picks, setPicks] = useState<Partial<Record<DocSlot, DocumentSource>>>({});

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [gov, stu] = await Promise.all([
        getMyVerification("government_id"),
        getMyVerification("student"),
      ]);
      setSubmissions({ government_id: gov, student: stu });
      setError(null);
    } catch {
      setError("Couldn't load your verification status.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const pickDocument = async (slot: DocSlot) => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Allow photo access to upload documents.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const validationError = validateVerificationDocument(asset);
    if (validationError) {
      setError(validationError);
      return;
    }
    setPicks((prev) => ({
      ...prev,
      [slot]: {
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      },
    }));
  };

  const removePick = (slot: DocSlot) => {
    setPicks((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      if (activeType === "government_id") {
        if (!picks.front) throw new Error("Add a photo of the front of your ID.");
        const front = await uploadVerificationDocument(user.id, "front", picks.front);
        const back = picks.back ? await uploadVerificationDocument(user.id, "back", picks.back) : null;
        const selfie = picks.selfie ? await uploadVerificationDocument(user.id, "selfie", picks.selfie) : null;
        const current = submissions.government_id;
        const isResubmit =
          current && (current.status === "rejected" || current.status === "resubmission_requested");
        const submission = isResubmit
          ? await resubmitVerification(current.id, {
              type: "government_id",
              front,
              back,
              selfie,
              governmentIdKind: govKind,
            })
          : await submitVerification({
              type: "government_id",
              front,
              back,
              selfie,
              governmentIdKind: govKind,
            });
        setSubmissions((prev) => ({ ...prev, government_id: submission }));
      } else {
        const current = submissions.student;
        const isResubmit =
          current && (current.status === "rejected" || current.status === "resubmission_requested");
        let card: string | null = null;
        let email: string | null = null;
        if (studentMethod === "card") {
          if (!picks.card) throw new Error("Upload a photo of your student ID card.");
          card = await uploadVerificationDocument(user.id, "student_card", picks.card);
        } else {
          if (!universityEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(universityEmail.trim())) {
            throw new Error("Enter a valid university email.");
          }
          email = universityEmail.trim().toLowerCase();
        }
        const submission = isResubmit
          ? await resubmitVerification(current.id, {
              type: "student",
              studentCard: card,
              universityEmail: email,
            })
          : await submitVerification({
              type: "student",
              studentCard: card,
              universityEmail: email,
            });
        setSubmissions((prev) => ({ ...prev, student: submission }));
      }
      setPicks({});
      setUniversityEmail("");
      void refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const current = submissions[activeType];
  const needsUpload = !current || current.status === "rejected" || current.status === "expired" || current.status === "resubmission_requested";
  const canSubmit = activeType === "government_id"
    ? Boolean(picks.front)
    : studentMethod === "card"
      ? Boolean(picks.card)
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(universityEmail.trim());

  const typeMeta = VERIFICATION_TYPES.find((t) => t.value === activeType)!;
  const TypeIcon = activeType === "government_id" ? BadgeCheck : GraduationCap;

  return (
    <PhoneShell>
      <TopBar title="Verification" subtitle="Build trust with your Covians" back onBack={() => router.back()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}>
        {VERIFICATION_TYPES.map((t) => (
          <Chip key={t.value} active={activeType === t.value} onPress={() => setActiveType(t.value)}>
            {t.label}
          </Chip>
        ))}
      </ScrollView>

      <Screen>
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
        >
          {loading ? (
            <View style={{ paddingVertical: 48, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <>
              {error ? (
                <StatusBanner
                  tone="danger"
                  icon={<XCircle size={16} color={colors.destructive} />}
                  title={error}
                />
              ) : null}

              {needsUpload ? (
                <>
                  {current?.status === "rejected" || current?.status === "resubmission_requested" ? (
                    <StatusBanner
                      tone="danger"
                      icon={<XCircle size={16} color={colors.destructive} />}
                      title="We couldn't verify your document"
                      body={
                        current.rejectionReason
                          ? `Reason: ${current.rejectionReason}`
                          : "Upload clearer images and try again."
                      }
                    />
                  ) : current?.status === "expired" ? (
                    <StatusBanner
                      tone="warning"
                      icon={<Clock3 size={16} color={colors.warning} />}
                      title="Your previous verification expired"
                      body="Submit again with up-to-date documents."
                    />
                  ) : (
                    <StatusBanner
                      tone="info"
                      icon={<TypeIcon size={16} color={colors.primary} />}
                      title="Verified travellers get 4x more approvals"
                      body="Your documents are only used for identity checks and are never shown to other users."
                    />
                  )}

                  <View style={styles.card}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ height: 40, width: 40, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                        <TypeIcon size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText size="sm" weight={600}>
                          {typeMeta.label}
                        </AppText>
                        <AppText size="xs" color={colors.mutedForeground}>
                          {activeType === "government_id"
                            ? "Passport, driver's licence or national ID"
                            : "Unlocks students-only rides on campus routes"}
                        </AppText>
                      </View>
                    </View>

                    {activeType === "government_id" ? (
                      <>
                        <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ marginTop: 16, marginBottom: 8 }}>
                          ID type
                        </AppText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                          {GOVERNMENT_ID_KINDS.map((k) => (
                            <Chip key={k.value} active={govKind === k.value} onPress={() => setGovKind(k.value)}>
                              {k.label}
                            </Chip>
                          ))}
                        </ScrollView>
                        <UploadTile
                          label="Front of your ID"
                          required
                          picked={picks.front}
                          onPress={() => void pickDocument("front")}
                          onRemove={() => removePick("front")}
                          style={{ marginTop: 16 }}
                        />
                        <UploadTile
                          label="Back of your ID"
                          optional
                          picked={picks.back}
                          onPress={() => void pickDocument("back")}
                          onRemove={() => removePick("back")}
                          style={{ marginTop: 12 }}
                        />
                        <UploadTile
                          label="Selfie"
                          optional
                          picked={picks.selfie}
                          onPress={() => void pickDocument("selfie")}
                          onRemove={() => removePick("selfie")}
                          style={{ marginTop: 12 }}
                        />
                      </>
                    ) : (
                      <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 16 }}>
                          <Chip active={studentMethod === "card"} onPress={() => setStudentMethod("card")}>
                            Student ID card
                          </Chip>
                          <Chip active={studentMethod === "email"} onPress={() => setStudentMethod("email")}>
                            University email
                          </Chip>
                        </ScrollView>
                        {studentMethod === "card" ? (
                          <UploadTile
                            label="Student ID card"
                            required
                            picked={picks.card}
                            onPress={() => void pickDocument("card")}
                            onRemove={() => removePick("card")}
                            style={{ marginTop: 16 }}
                          />
                        ) : (
                          <View style={{ marginTop: 16 }}>
                            <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ marginBottom: 8 }}>
                              University email
                            </AppText>
                            <Input
                              placeholder="you@university.edu"
                              value={universityEmail}
                              onChangeText={setUniversityEmail}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="email-address"
                            />
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  <Button
                    block
                    disabled={submitting || !canSubmit}
                    style={{ height: 48, borderRadius: 16 }}
                    onPress={() => void handleSubmit()}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                      <AppText size="sm" weight={600} color={colors.primaryForeground}>
                        {current?.status === "rejected" || current?.status === "resubmission_requested"
                          ? "Submit again"
                          : "Submit verification"}
                      </AppText>
                    )}
                  </Button>
                </>
              ) : null}

              {current?.status === "pending" ? (
                <ScaleIn>
                  <ResultCard
                    tone="warning"
                    icon={<Clock3 size={32} color={colors.warning} />}
                    title="Verification in review"
                    body={`Your ${activeType === "government_id" ? "government ID" : "student"} check is in progress. Most checks finish within 4 hours. We'll notify you as soon as it's done.`}
                    extra={<Progress value={62} style={{ marginTop: 20, height: 6 }} />}
                  />
                </ScaleIn>
              ) : null}

              {current?.status === "approved" ? (
                <ScaleIn>
                  <ResultCard
                    tone="success"
                    icon={<CheckCircle2 size={32} color={colors.success} />}
                    title="You're verified"
                    body="Your ID badge is now visible on your profile and every ride you host or join."
                    extra={
                      <Button block style={{ marginTop: 24, height: 48, borderRadius: 16 }} onPress={() => router.navigate("/home")}>
                        <AppText size="sm" weight={600} color={colors.primaryForeground}>
                          Go to home
                        </AppText>
                      </Button>
                    }
                  />
                </ScaleIn>
              ) : null}
            </>
          )}
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}

function UploadTile({
  label,
  required,
  optional,
  picked,
  onPress,
  onRemove,
  style,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  picked?: DocumentSource;
  onPress: () => void;
  onRemove: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <AppText size="xs" weight={600} color={colors.mutedForeground}>
        {label}
        {optional ? " (optional)" : ""}
        {required ? " *" : ""}
      </AppText>
      {picked ? (
        <View
          style={{
            marginTop: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.secondary,
            padding: 10,
          }}
        >
          <Image source={{ uri: picked.uri }} style={{ height: 40, width: 40, borderRadius: 10 }} />
          <AppText size="xs" numberOfLines={1} style={{ flex: 1 }}>
            {picked.fileName || label}
          </AppText>
          <Pressable onPress={onRemove} hitSlop={8}>
            <XCircle size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onPress}
          style={{
            marginTop: 8,
            alignItems: "center",
            gap: 6,
            borderRadius: 16,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: colors.border,
            backgroundColor: `${colors.secondary}99`,
            paddingVertical: 24,
          }}
        >
          <Upload size={20} color={colors.mutedForeground} />
          <AppText size="xs" weight={500} color={colors.mutedForeground}>
            Tap to upload
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

function ResultCard({
  tone,
  icon,
  title,
  body,
  extra,
}: {
  tone: "success" | "warning" | "danger";
  icon: React.ReactNode;
  title: string;
  body: string;
  extra?: React.ReactNode;
}) {
  const tones = {
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.destructiveSoft, fg: colors.destructive },
  }[tone];
  return (
    <View style={[styles.card, { alignItems: "center", paddingVertical: 24 }]}>
      <View style={{ height: 64, width: 64, borderRadius: 24, backgroundColor: tones.bg, alignItems: "center", justifyContent: "center" }}>
        {icon}
      </View>
      <AppText family="display" size="lg" weight={700} style={{ marginTop: 16 }}>
        {title}
      </AppText>
      <AppText size="sm" color={colors.mutedForeground} style={{ marginTop: 8, textAlign: "center" }}>
        {body}
      </AppText>
      {extra}
    </View>
  );
}

const styles = {
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    ...shadows.soft,
  },
};

