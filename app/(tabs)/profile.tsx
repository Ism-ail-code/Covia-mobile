import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Settings, Pencil, Star, ShieldCheck, Route as RouteIcon, ChevronRight } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadges, StatBlock, Rating } from "@/components/app/Badges";
import { Button, IconButton } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getMyTrustSummary, getUserRatings } from "@/services/trust";
import { DEFAULT_PROFILE } from "@/types/profile";
import type { TrustSummary, UserRating } from "@/types/trust";

const links = [
  { label: "Ratings & reviews", to: "/ratings" as const, icon: Star },
  { label: "Safety centre", to: "/safety" as const, icon: ShieldCheck },
  { label: "Verification status", to: "/verification" as const, icon: RouteIcon },
];

const joinedLabel = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "…";

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export default function Profile() {
  const router = useRouter();
  const { profile, user, emailVerified, isAdmin } = useAuth();
  const [summary, setSummary] = useState<TrustSummary | null>(null);
  const [reviews, setReviews] = useState<UserRating[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let active = true;
      getMyTrustSummary()
        .then((s) => {
          if (active) setSummary(s);
        })
        .catch(() => {});
      getUserRatings(user.id, 1, 10)
        .then((page) => {
          if (active) setReviews(page.items);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const displayName = profile?.displayName ?? user?.user_metadata?.full_name ?? "Covia";
  const initials = displayName.slice(0, 2).toUpperCase();
  const bio = profile?.bio ?? "Covia is a social ride-coordination community.";
  const homeCity = profile?.homeCity ?? "Lagos";
  const rating = summary?.averageRating ?? DEFAULT_PROFILE.rating;
  const reliability = summary?.reliabilityScore ?? DEFAULT_PROFILE.reliabilityScore;
  const rides = summary?.completedRides ?? DEFAULT_PROFILE.totalCompletedRides;

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
              {profile?.username ? (
                <AppText size="xs" weight={600} color={colors.primary}>
                  @{profile.username}
                </AppText>
              ) : null}
              <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 2 }}>
                Joined {joinedLabel(profile?.createdAt)} · {homeCity}
                {profile?.country ? `, ${profile.country}` : ""}
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
              <Button variant="secondary" style={{ marginTop: 16, height: 44, borderRadius: radius.lg, paddingHorizontal: 24 }} onPress={() => router.push("/create-profile")}>
                <Pencil size={16} color={colors.secondaryForeground} />
                <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                  Edit profile
                </AppText>
              </Button>
            </View>

            <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
              <StatBlock label="Rating" value={rating.toFixed(1)} />
              <StatBlock label="Reliability" value={`${reliability}%`} />
              <StatBlock label="Rides" value={`${rides}`} />
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
              {isAdmin ? (
                <Pressable
                  onPress={() => router.push("/admin")}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 16,
                      opacity: pressed ? 0.7 : 1,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      backgroundColor: colors.primarySoft,
                    },
                  ]}
                >
                  <ShieldCheck size={18} color={colors.primary} />
                  <AppText size="sm" weight={600} color={colors.primary} style={{ flex: 1 }}>
                    Admin console
                  </AppText>
                  <ChevronRight size={16} color={colors.primary} />
                </Pressable>
              ) : null}
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
                    <Avatar size={36} fallback={(r.raterName ?? "C")[0]?.toUpperCase() ?? "C"} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText size="sm" weight={600} numberOfLines={1}>
                        {r.raterName ?? "A Covian"}
                      </AppText>
                      <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                        {timeAgo(r.createdAt)}
                      </AppText>
                    </View>
                    <Rating value={r.overallRating} />
                  </View>
                  {r.comment ? (
                    <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 8, lineHeight: 18 }}>
                      {r.comment}
                    </AppText>
                  ) : null}
                </View>
              ))}
              {!reviews.length ? (
                <AppText size="xs" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 12 }}>
                  No reviews yet — they appear here once both sides rate.
                </AppText>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
