import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Settings, Pencil, Star, ShieldCheck, Route as RouteIcon, ChevronRight } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadges, StatBlock, Rating } from "@/components/app/Badges";
import { Button, IconButton } from "@/components/ui/Button";
import { currentUser, reviews } from "@/data/mock";
import { useAuth } from "@/context/AuthContext";

const links = [
  { label: "Ratings & reviews", to: "/ratings" as const, icon: Star },
  { label: "Safety centre", to: "/safety" as const, icon: ShieldCheck },
  { label: "Verification status", to: "/verification" as const, icon: RouteIcon },
];

export default function Profile() {
  const router = useRouter();
  const { profile, user, emailVerified } = useAuth();

  const displayName = profile?.displayName ?? user?.user_metadata?.full_name ?? "Companion";
  const initials = displayName.slice(0, 2).toUpperCase();
  const bio = profile?.bio ?? currentUser.bio;
  const homeCity = profile?.homeCity ?? "Lagos";
  const rating = profile?.rating ?? currentUser.rating;
  const reliability = profile?.reliabilityScore ?? currentUser.reliability;

  return (
    <PhoneShell>
      <Screen>
        <TopBar
          title="Profile"
          action={
            <IconButton accessibilityLabel="Settings" onPress={() => router.push("/settings")}>
              <Settings size={18} color={colors.secondaryForeground} />
            </IconButton>
          }
        />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
            <View
              style={[
                {
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  padding: 20,
                  alignItems: "center",
                },
                shadows.soft,
              ]}
            >
              <Avatar size={96} src={profile?.avatarUrl ?? null} name={displayName} fallback={initials} ring="primarySoft" />
              <AppText size="xl" family="display" weight={800} style={{ marginTop: 12 }}>
                {displayName}
              </AppText>
              <AppText size="xs" color={colors.mutedForeground}>
                Joined {currentUser.joined} · {homeCity}
              </AppText>
              <View style={{ marginTop: 12 }}>
                {emailVerified && profile?.verificationStatus === "Verified" ? (
                  <VerificationBadges items={["id", "email"]} />
                ) : (
                  <AppText size="xs" weight={600} color={colors.primary}>
                    {profile?.verificationStatus === "Rejected"
                      ? "Verification rejected — review your documents"
                      : "Account verification pending"}
                  </AppText>
                )}
              </View>
              <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 12, textAlign: "center", maxWidth: 230 }}>
                {bio}
              </AppText>
              <Button variant="secondary" style={{ marginTop: 16, height: 44, borderRadius: radius.lg, paddingHorizontal: 24 }} onPress={() => router.push("/settings")}>
                <Pencil size={16} color={colors.secondaryForeground} />
                <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                  Edit profile
                </AppText>
              </Button>
            </View>

            <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
              <StatBlock label="Rating" value={rating.toFixed(1)} />
              <StatBlock label="Reliability" value={`${reliability}%`} />
              <StatBlock label="Rides" value={`${currentUser.rides}`} />
            </View>

            <View
              style={{
                marginTop: 16,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                overflow: "hidden",
              }}
            >
              {links.map(({ label, to, icon: Icon }, i) => (
                <Pressable
                  key={label}
                  onPress={() => router.push(to)}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 16,
                      opacity: pressed ? 0.7 : 1,
                    },
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <Icon size={18} color={colors.primary} />
                  <AppText size="sm" weight={500} style={{ flex: 1 }}>
                    {label}
                  </AppText>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <AppText size="lg" family="display" weight={700}>
                Recent reviews
              </AppText>
              <Pressable onPress={() => router.push("/ratings")}>
                <AppText size="xs" weight={600} color={colors.primary}>
                  See all
                </AppText>
              </Pressable>
            </View>
            <View style={{ gap: 12 }}>
              {reviews.slice(0, 2).map((r) => (
                <View
                  key={r.id}
                  style={[
                    {
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      padding: 16,
                    },
                    shadows.soft,
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Avatar size={36} src={r.author.photo} name={r.author.name} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText size="sm" weight={600} numberOfLines={1}>
                        {r.author.name}
                      </AppText>
                      <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                        {r.time}
                      </AppText>
                    </View>
                    <Rating value={r.rating} />
                  </View>
                  <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 8, lineHeight: 18 }}>
                    {r.text}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
