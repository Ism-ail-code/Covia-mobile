import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  BadgeCheck,
  Camera,
  Clock3,
  CheckCircle2,
  GraduationCap,
  Image as ImageIcon,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatusBanner } from "@/components/app/EmptyState";
import { Progress } from "@/components/ui/Progress";
import { ScaleIn, Stagger } from "@/components/ui/animations";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
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
import { maybeCompressDocument, shouldCompress } from "@/services/imageCompression";

type DocSlot = "front" | "back" | "selfie" | "card";

type PickPhase = {
  label: string;
  fraction: number;
};

const PICK_PHASES: PickPhase[] = [
  { label: "Preparing images…", fraction: 0.15 },
  { label: "Uploading documents…", fraction: 0.55 },
  { label: "Submitting verification…", fraction: 0.92 },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VerificationScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isFlowStep = from === "flow";
  const { user, refreshProfile, setOnboardingStep } = useAuth();

  const [activeType, setActiveType] = useState<VerificationType>("government_id");
  const [submissions, setSubmissions] = useState<
    Partial<Record<VerificationType, VerificationSubmission | null>>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<PickPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [govKind, setGovKind] = useState<GovernmentIdKind>("national_id");
  const [studentMethod, setStudentMethod] = useState<"card" | "email">("card");
  const [universityEmail, setUniversityEmail] = useState("");
  const [picks, setPicks] = useState<Partial<Record<DocSlot, DocumentSource>>>({});
  const [sheetSlot, setSheetSlot] = useState<DocSlot | null>(null);
  const [compressing, setCompressing] = useState(false);
  const mountedRef = useRef(true);

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
      if (!mountedRef.current) return;
      setSubmissions({ government_id: gov, student: stu });
      setError(null);
    } catch {
      if (!mountedRef.current) return;
      setError("Couldn't load your verification status.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openPicker = (slot: DocSlot, source: "camera" | "library") => {
    setSheetSlot(null);
    void (async () => {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(
          source === "camera"
            ? "Allow camera access to take a document photo."
            : "Allow photo access to upload documents.",
        );
        return;
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const validationError = validateVerificationDocument(asset);
      if (validationError) {
        setError(validationError);
        return;
      }
      // Camera photos are large — compress right away so the preview and
      // the eventual upload both work on the small file.
      setCompressing(true);
      try {
        const processed = await maybeCompressDocument({
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
        });
        setPicks((prev) => ({ ...prev, [slot]: processed }));
      } catch {
        setPicks((prev) => ({
          ...prev,
          [slot]: {
            uri: asset.uri,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            fileSize: asset.fileSize,
          },
        }));
      } finally {
        setCompressing(false);
      }
    })();
  };

  const removePick = (slot: DocSlot) => {
    setPicks((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const isGov = activeType === "government_id";
      const slots: DocSlot[] = isGov
        ? ["front", ...(picks.back ? (["back"] as DocSlot[]) : []), ...(picks.selfie ? (["selfie"] as DocSlot[]) : [])]
        : ["card"];

      // 1 — Prepare (compress) every picked document.
      setPhase(PICK_PHASES[0]);
      const prepared: Partial<Record<DocSlot, DocumentSource>> = {};
      for (const slot of slots) {
        const pick = picks[slot];
        if (!pick) continue;
        prepared[slot] = await maybeCompressDocument(pick);
      }

      // 2 — Upload each document.
      setPhase(PICK_PHASES[1]);
      const paths: Partial<Record<DocSlot, string>> = {};
      const slotKey: Record<string, "front" | "back" | "selfie" | "student_card"> = {
        front: "front",
        back: "back",
        selfie: "selfie",
        card: "student_card",
      };
      for (const slot of slots) {
        const doc = prepared[slot];
        if (!doc) continue;
        paths[slot] = await uploadVerificationDocument(user.id, slotKey[slot], doc);
      }

      // 3 — Submit.
      setPhase(PICK_PHASES[2]);
      if (isGov) {
        const current = submissions.government_id;
        const isResubmit =
          current &&
          (current.status === "rejected" ||
            current.status === "resubmission_requested" ||
            current.status === "expired");
        const submission = isResubmit
          ? await resubmitVerification(current.id, {
              type: "government_id",
              front: paths.front ?? null,
              back: paths.back ?? null,
              selfie: paths.selfie ?? null,
              governmentIdKind: govKind,
            })
          : await submitVerification({
              type: "government_id",
              front: paths.front ?? null,
              back: paths.back ?? null,
              selfie: paths.selfie ?? null,
              governmentIdKind: govKind,
            });
        setSubmissions((prev) => ({ ...prev, government_id: submission }));
      } else {
        const current = submissions.student;
        const isResubmit =
          current &&
          (current.status === "rejected" ||
            current.status === "resubmission_requested" ||
            current.status === "expired");
        let card: string | null = null;
        let email: string | null = null;
        if (studentMethod === "card") {
          if (!picks.card) throw new Error("Upload a photo of your student ID card.");
          card = paths.card ?? null;
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
      setPhase(null);
      void refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const finishFlow = async () => {
    try {
      await setOnboardingStep("complete");
    } catch {
      // The local profile stays on 'verify' — the guard will send the
      // user back here next launch; not fatal.
    }
    router.replace("/home");
  };

  const current = submissions[activeType];
  const needsUpload =
    !current ||
    current.status === "rejected" ||
    current.status === "expired" ||
    current.status === "resubmission_requested";
  const canSubmit =
    activeType === "government_id"
      ? Boolean(picks.front)
      : studentMethod === "card"
        ? Boolean(picks.card)
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(universityEmail.trim());

  const typeMeta = VERIFICATION_TYPES.find((t) => t.value === activeType)!;
  const TypeIcon = activeType === "government_id" ? BadgeCheck : GraduationCap;

  return (
    <PhoneShell>
      <TopBar
        title="Identity verification"
        subtitle="Build trust with your Covians"
        back
        onBack={() => router.back()}
      />

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
              {isFlowStep ? <IntroCard onSkip={finishFlow} /> : null}

              {error ? (
                <>
                  <StatusBanner
                    tone="danger"
                    icon={<XCircle size={16} color={colors.destructive} />}
                    title={error}
                  />
                  <Button variant="outline" style={{ height: 44, borderRadius: radius.lg }} onPress={load}>
                    <AppText size="sm" weight={600} color={colors.primary}>
                      Try again
                    </AppText>
                  </Button>
                </>
              ) : null}

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {VERIFICATION_TYPES.map((t) => (
                  <Chip key={t.value} active={activeType === t.value} onPress={() => setActiveType(t.value)}>
                    {t.label}
                  </Chip>
                ))}
              </ScrollView>

              {needsUpload ? (
                <Stagger>
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
                  ) : null}

                  <View style={styles.card}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={styles.iconBox}>
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
                          compressing={compressing}
                          onPick={() => setSheetSlot("front")}
                          onRemove={() => removePick("front")}
                          style={{ marginTop: 16 }}
                        />
                        <UploadTile
                          label="Back of your ID"
                          optional
                          picked={picks.back}
                          compressing={compressing}
                          onPick={() => setSheetSlot("back")}
                          onRemove={() => removePick("back")}
                          style={{ marginTop: 12 }}
                        />
                        <UploadTile
                          label="Selfie"
                          optional
                          picked={picks.selfie}
                          compressing={compressing}
                          onPick={() => setSheetSlot("selfie")}
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
                            compressing={compressing}
                            onPick={() => setSheetSlot("card")}
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

                  {phase && submitting ? (
                    <View style={styles.card}>
                      <AppText size="xs" weight={600} color={colors.mutedForeground}>
                        {phase.label}
                      </AppText>
                      <Progress value={phase.fraction * 100} style={{ marginTop: 10, height: 6 }} />
                    </View>
                  ) : null}

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

                  {isFlowStep ? (
                    <Button variant="ghost" style={{ height: 44 }} onPress={finishFlow}>
                      <AppText size="sm" color={colors.mutedForeground}>
                        I'll verify later
                      </AppText>
                    </Button>
                  ) : null}
                </Stagger>
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
                      <Button
                        block
                        style={{ marginTop: 24, height: 48, borderRadius: 16 }}
                        onPress={() => (isFlowStep ? void finishFlow() : router.back())}
                      >
                        <AppText size="sm" weight={600} color={colors.primaryForeground}>
                          {isFlowStep ? "Go to home" : "Done"}
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

      <BottomSheet
        visible={sheetSlot !== null}
        onClose={() => setSheetSlot(null)}
        title="Add document photo"
      >
        <SheetOption
          icon={Camera}
          label="Take a photo"
          caption="Use your camera for the sharpest scan"
          onPress={() => sheetSlot && openPicker(sheetSlot, "camera")}
        />
        <SheetOption
          icon={ImageIcon}
          label="Choose from library"
          caption="Pick an existing image"
          onPress={() => sheetSlot && openPicker(sheetSlot, "library")}
        />
        <Pressable
          onPress={() => setSheetSlot(null)}
          style={{ height: 48, alignItems: "center", justifyContent: "center", marginTop: 4 }}
        >
          <AppText size="sm" weight={600} color={colors.destructive}>
            Cancel
          </AppText>
        </Pressable>
      </BottomSheet>
    </PhoneShell>
  );
}

/** Why verification matters — shown only during the onboarding step. */
function IntroCard({ onSkip }: { onSkip: () => void }) {
  const rows: { icon: LucideIcon; title: string; body: string }[] = [
    {
      icon: ShieldCheck,
      title: "Everyone is checked",
      body: "Every Covian verifies who they are. You'll see the same badge on other people's profiles.",
    },
    {
      icon: BadgeCheck,
      title: "Accepted documents",
      body: "National ID, driver's licence or passport. Students can also use a university email.",
    },
    {
      icon: Clock3,
      title: "Reviewed within 4 hours",
      body: "Your documents are used for the identity check only — never shown to other users.",
    },
  ];
  return (
    <View style={[styles.card, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}>
      <AppText family="display" size="lg" weight={700}>
        One quick check
      </AppText>
      <AppText size="sm" color={colors.mutedForeground} style={{ marginTop: 4 }}>
        Identity verification is the last step before you can host and join rides.
      </AppText>
      <View style={{ marginTop: 16, gap: 12 }}>
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <View style={[styles.iconBox, { width: 34, height: 34, borderRadius: 12 }]}>
                <Icon size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText size="sm" weight={600}>
                  {row.title}
                </AppText>
                <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 2, lineHeight: 18 }}>
                  {row.body}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SheetOption({
  icon: Icon,
  label,
  caption,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 20,
          paddingVertical: 12,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.iconBox, { width: 40, height: 40, borderRadius: 14 }]}>
        <Icon size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText size="sm" weight={600}>
          {label}
        </AppText>
        <AppText size="xs" color={colors.mutedForeground}>
          {caption}
        </AppText>
      </View>
    </Pressable>
  );
}

function UploadTile({
  label,
  required,
  optional,
  picked,
  compressing,
  onPick,
  onRemove,
  style,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  picked?: DocumentSource;
  compressing?: boolean;
  onPick: () => void;
  onRemove: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <AppText size="xs" weight={600} color={colors.mutedForeground}>
          {label}
          {optional ? " (optional)" : ""}
          {required ? " *" : ""}
        </AppText>
      </View>
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
            backgroundColor: colors.card,
            padding: 10,
          }}
        >
          <Image source={{ uri: picked.uri }} style={{ height: 56, width: 56, borderRadius: 12 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText size="xs" numberOfLines={1} weight={600}>
              {picked.fileName || label}
            </AppText>
            <AppText size="xs" color={colors.mutedForeground}>
              {picked.fileSize != null ? formatBytes(picked.fileSize) : "Ready"}
              {shouldCompress(picked) ? " · will compress" : ""}
            </AppText>
          </View>
          <Pressable
            onPress={onPick}
            hitSlop={8}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.secondary }}
          >
            <AppText size="xs" weight={600} color={colors.primary}>
              Replace
            </AppText>
          </Pressable>
          <Pressable onPress={onRemove} hitSlop={8} style={{ padding: 4 }}>
            <Trash2 size={16} color={colors.destructive} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onPick}
          disabled={compressing}
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
            opacity: compressing ? 0.6 : 1,
          }}
        >
          {compressing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Upload size={20} color={colors.mutedForeground} />
              <AppText size="xs" weight={500} color={colors.mutedForeground}>
                Tap to add
              </AppText>
              <AppText size="xs" color={colors.mutedForeground}>
                Camera or library · JPEG, PNG, WebP
              </AppText>
            </>
          )}
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
  iconBox: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
