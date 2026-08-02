import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Rating } from "@/components/app/Badges";
import { EmptyState } from "@/components/app/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { getRideHistory } from "@/services/rides";
import { getMyTrustSummary, getRideRatingStatus, getUserRatings, rateRide } from "@/services/trust";
import type { RideRatingStatus, TrustSummary, UserRating } from "@/types/trust";

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4, marginBottom: 12 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Pressable key={i} onPress={() => onChange(i + 1)} hitSlop={4}>
          <Star
            size={28}
            color={i < value ? colors.warning : colors.muted}
            fill={i < value ? colors.warning : "transparent"}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function Ratings() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [summary, setSummary] = useState<TrustSummary | null>(null);
  const [received, setReceived] = useState<UserRating[]>([]);
  const [rateable, setRateable] = useState<{ rideId: string; target: RideRatingStatus } | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = user?.id;
        if (!me) throw new Error("Please sign in again.");
        const [mySummary, myReviews] = await Promise.all([
          getMyTrustSummary(),
          getUserRatings(me, 1, 10),
        ]);
        if (cancelled) return;
        setSummary(mySummary);
        setReceived(myReviews.items);

        const history = await getRideHistory(null, null, 1, 20);
        if (cancelled) return;
        const completed = history.entries.find((e) => e.rideStatus === "completed");
        if (completed) {
          const statuses = await getRideRatingStatus(completed.rideId).catch(() => [] as RideRatingStatus[]);
          if (cancelled) return;
          const target = statuses.find((s) => s.ratingId == null && !s.windowExpired);
          if (target) setRateable({ rideId: completed.rideId, target });
        }
      } catch (e) {
        if (!cancelled) toast.error((e as Error).message || "Couldn't load your ratings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, toast]);

  const submit = useCallback(async () => {
    if (!rateable) return;
    if (stars < 1) {
      toast.error("Pick a star rating", { description: "Tap a star to rate your Covian." });
      return;
    }
    setSubmitting(true);
    try {
      await rateRide(rateable.rideId, rateable.target.rateeUserId, {
        overallRating: stars,
        comment: comment.trim() || null,
      });
      toast.success("Review posted", { description: "Thanks for keeping Covia trusted. It reveals when they rate back." });
      setRateable(null);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't post your review.");
    } finally {
      setSubmitting(false);
    }
  }, [rateable, stars, comment, toast]);

  return (
    <PhoneShell>
      <TopBar title="Ratings & reviews" back onBack={() => router.back()} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
          <View style={[styles.card, { alignItems: "center" }]}>
            <AppText family="display" weight={800} style={{ fontSize: 36, lineHeight: 44 }}>
              {loading ? "—" : (summary?.averageRating ?? 0).toFixed(1)}
            </AppText>
            <View style={{ marginTop: 4, flexDirection: "row", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  color={colors.warning}
                  fill={i < Math.round(summary?.averageRating ?? 0) ? colors.warning : "transparent"}
                />
              ))}
            </View>
            <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 4 }}>
              {loading
                ? "Loading…"
                : `Based on ${summary?.ratingCount ?? 0} ratings · ${summary?.completedRides ?? 0} completed rides`}
            </AppText>
          </View>

          {rateable ? (
            <View style={[styles.card]}>
              <AppText size="sm" weight={600} style={{ marginBottom: 8 }}>
                Leave a review
              </AppText>
              <AppText size="xs" color={colors.mutedForeground} style={{ marginBottom: 12, lineHeight: 18 }}>
                Your review stays hidden until your counterpart rates you — then both are revealed.
              </AppText>
              <StarPicker value={stars} onChange={setStars} />
              <Textarea
                placeholder="How was the ride?"
                style={{ borderRadius: 16, minHeight: 76 }}
                value={comment}
                onChangeText={setComment}
              />
              <Button block style={{ marginTop: 12, height: 48, borderRadius: 16 }} disabled={submitting} onPress={submit}>
                <AppText size="sm" weight={600} color={colors.primaryForeground}>
                  {submitting ? "Posting…" : "Post review"}
                </AppText>
              </Button>
            </View>
          ) : !loading ? (
            <View style={[styles.card]}>
              <AppText size="sm" weight={600} style={{ marginBottom: 4 }}>
                Nothing to rate right now
              </AppText>
              <AppText size="xs" color={colors.mutedForeground} style={{ lineHeight: 18 }}>
                Reviews open after a completed ride and stay available for 72 hours.
              </AppText>
            </View>
          ) : null}

          <AppText size="sm" weight={600} style={{ marginTop: 4 }}>
            Reviews about you
          </AppText>
          {loading ? (
            <AppText size="xs" color={colors.mutedForeground}>
              Loading reviews…
            </AppText>
          ) : received.length ? (
            received.map((r) => (
              <View key={r.id} style={[styles.card]}>
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
            ))
          ) : (
            <EmptyState
              icon={<Star size={28} color={colors.primary} />}
              title="No reviews yet"
              body="Completed rides with both sides rating reveal reviews here."
            />
          )}
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
    padding: 16,
    ...shadows.soft,
  },
};
