import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import {
  BadgeCheck,
  GraduationCap,
  Upload,
  Clock3,
  CheckCircle2,
  XCircle,
  FileText,
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

type State = "upload" | "pending" | "approved" | "rejected";

const docs = [
  { icon: BadgeCheck, title: "Government ID", body: "Passport, driver's licence or national ID" },
  { icon: GraduationCap, title: "Student ID", body: "Unlocks students-only rides on campus routes" },
];

export default function VerificationScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>("upload");

  return (
    <PhoneShell>
      <TopBar title="Verification" subtitle="Build trust with your companions" back onBack={() => router.back()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}>
        {(["upload", "pending", "approved", "rejected"] as State[]).map((s) => (
          <Chip key={s} active={state === s} onPress={() => setState(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Chip>
        ))}
      </ScrollView>

      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}>
          {state === "upload" ? (
            <>
              <StatusBanner
                tone="info"
                icon={<BadgeCheck size={16} color={colors.primary} />}
                title="Verified travellers get 4x more approvals"
                body="Your documents are only used for identity checks and are never shown to other users."
              />
              {docs.map(({ icon: Icon, title, body }) => (
                <View key={title} style={styles.card}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ height: 40, width: 40, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                      <Icon size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText size="sm" weight={600}>
                        {title}
                      </AppText>
                      <AppText size="xs" color={colors.mutedForeground}>
                        {body}
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={{
                      marginTop: 12,
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
                      Tap to upload a photo or PDF
                    </AppText>
                  </View>
                </View>
              ))}
              <View style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 16 }}>
                <AppText size="sm" weight={600} style={{ marginBottom: 8 }}>
                  Uploaded documents
                </AppText>
                {["national-id-front.jpg", "student-card-2026.pdf"].map((f, i) => (
                  <View
                    key={f}
                    style={[
                      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
                      i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}
                  >
                    <FileText size={16} color={colors.mutedForeground} />
                    <AppText size="xs" numberOfLines={1} style={{ flex: 1 }}>
                      {f}
                    </AppText>
                    <AppText size="xs" weight={600} color={colors.success} style={{ fontSize: 11 }}>
                      Uploaded
                    </AppText>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {state === "pending" ? (
            <ScaleIn>
              <ResultCard
                tone="warning"
                icon={<Clock3 size={32} color={colors.warning} />}
                title="Verification in review"
                body="Most checks finish within 4 hours. We'll notify you as soon as it's done."
                extra={<Progress value={62} style={{ marginTop: 20, height: 6 }} />}
              />
            </ScaleIn>
          ) : null}

          {state === "approved" ? (
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

          {state === "rejected" ? (
            <ScaleIn>
              <ResultCard
                tone="danger"
                icon={<XCircle size={32} color={colors.destructive} />}
                title="We couldn't verify this document"
                body="The photo was too blurry to read. Upload a clearer image in good lighting."
                extra={
                  <Button variant="secondary" block style={{ marginTop: 24, height: 48, borderRadius: 16 }} onPress={() => setState("upload")}>
                    <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                      Upload again
                    </AppText>
                  </Button>
                }
              />
            </ScaleIn>
          ) : null}
        </ScrollView>
      </Screen>
    </PhoneShell>
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
