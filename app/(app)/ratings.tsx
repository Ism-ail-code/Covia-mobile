import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Star, Flag } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Rating } from "@/components/app/Badges";
import { useToast } from "@/components/ui/Toast";
import { reviews, currentUser } from "@/data/mock";

export default function Ratings() {
  const router = useRouter();
  const toast = useToast();

  return (
    <PhoneShell>
      <TopBar title="Ratings & reviews" back onBack={() => router.back()} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
          <View style={[styles.card, { alignItems: "center" }]}>
            <AppText family="display" weight={800} style={{ fontSize: 36, lineHeight: 44 }}>
              {currentUser.rating.toFixed(1)}
            </AppText>
            <View style={{ marginTop: 4, flexDirection: "row", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} color={colors.warning} fill={colors.warning} />
              ))}
            </View>
            <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 4 }}>
              Based on {currentUser.rides} completed rides
            </AppText>
          </View>

          <View style={[styles.card]}>
            <AppText size="sm" weight={600} style={{ marginBottom: 8 }}>
              Leave a review
            </AppText>
            <View style={{ flexDirection: "row", gap: 4, marginBottom: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={28} color={colors.warning} fill={colors.warning} />
              ))}
            </View>
            <Textarea placeholder="How was the ride?" style={{ borderRadius: 16, minHeight: 76 }} />
            <Button
              block
              style={{ marginTop: 12, height: 48, borderRadius: 16 }}
              onPress={() => toast.success("Review posted", { description: "Thanks for keeping Covia trusted." })}
            >
              <AppText size="sm" weight={600} color={colors.primaryForeground}>
                Post review
              </AppText>
            </Button>
          </View>

          {reviews.map((r) => (
            <View key={r.id} style={[styles.card]}>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                <Flag size={12} color={colors.mutedForeground} />
                <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ fontSize: 11 }}>
                  Report
                </AppText>
              </View>
            </View>
          ))}
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
