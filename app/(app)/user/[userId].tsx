import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Flag, Star, UserX } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { StatBlock, Rating, ReliabilityPill } from "@/components/app/Badges";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/app/EmptyState";
import { getPublicProfile } from "@/services/profiles";
import { getUserRatings } from "@/services/trust";
import type { PublicProfile } from "@/types/profile";
import type { UserRating } from "@/types/trust";

const joinedLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const [p, page] = await Promise.all([
          getPublicProfile(userId),
          getUserRatings(userId, 1, 10),
        ]);
        if (cancelled) return;
        if (!p) throw new Error("We couldn't find that Covian.");
        setProfile(p);
        setRatings(page.items);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Couldn't load this profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <PhoneShell>
        <TopBar title="Profile" back onBack={() => router.back()} />
        <Screen>
          <View style={{ padding: 40, alignItems: "center", gap: 8 }}>
            <AppText size="sm" color={colors.mutedForeground}>
              Loading profile…
            </AppText>
          </View>
        </Screen>
      </PhoneShell>
    );
  }

  if (error || !profile) {
    return (
      <PhoneShell>
        <TopBar title="Profile" back onBack={() => router.back()} />
        <Screen>
          <EmptyState
            icon={<UserX size={28} color={colors.mutedForeground} />}
            title="Profile not found"
            body={error ?? "This Covian doesn't exist."}
          />
        </Screen>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <TopBar title={profile.displayName ?? "Covian"} subtitle={`Joined ${joinedLabel(profile.createdAt)}`} back onBack={() => router.back()} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
          <View style={[styles.card, { alignItems: "center" }]}>
            <Avatar
              size={96}
              src={profile.avatarUrl}
              name={profile.displayName ?? "Covian"}
              ring="primarySoft"
            />
            <AppText size="xl" family="display" weight={800} style={{ marginTop: 12 }}>
              {profile.displayName ?? "Covian"}
            </AppText>
            {profile.city ? (
              <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 2 }}>
                {profile.city}
                {profile.country ? `, ${profile.country}` : ""}
              </AppText>
            ) : null}
            <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
              <ReliabilityPill value={profile.reliabilityScore} />
              {profile.isGovernmentIdVerified || profile.isStudentVerified ? (
                <View
                  style={{
                    borderRadius: radius.full,
                    backgroundColor: colors.primarySoft,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <AppText size="xs" weight={600} color={colors.primary} style={{ fontSize: 10, lineHeight: 12 }}>
                    {profile.isGovernmentIdVerified ? "ID verified" : "Student verified"}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatBlock label="Rating" value={profile.overallRating.toFixed(1)} />
            <StatBlock label="Reliability" value={`${profile.reliabilityScore}%`} />
            <StatBlock label="Rides" value={`${profile.totalCompletedRides}`} />
          </View>

          <AppText size="sm" weight={600} style={{ marginTop: 4 }}>
            Reviews
          </AppText>
          {ratings.length ? (
            <View style={{ gap: 12 }}>
              {ratings.map((r) => (
                <View key={r.id} style={[styles.card]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Avatar size={36} fallback={(r.raterName ?? "C")[0]?.toUpperCase() ?? "C"} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText size="sm" weight={600} numberOfLines={1}>
                        {r.raterName ?? "A Covian"}
                      </AppText>
                    </View>
                    <Rating value={r.overallRating} />
                  </View>
                  {r.comment ? (
                    <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 8 }}>
                      {r.comment}
                    </AppText>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Star size={28} color={colors.primary} />}
              title="No reviews yet"
              body="Revealed reviews appear here after both sides rate."
            />
          )}

          <Button variant="ghost" block style={{ height: 44, borderRadius: radius.lg }} onPress={() => router.push("/safety")}>
            <Flag size={16} color={colors.destructive} />
            <AppText size="sm" weight={600} color={colors.destructive}>
              Report this user
            </AppText>
          </Button>
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}

const styles = {
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 20,
    ...shadows.soft,
  },
};
