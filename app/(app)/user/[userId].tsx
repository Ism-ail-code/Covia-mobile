import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Flag } from "lucide-react-native";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadges, StatBlock, Rating } from "@/components/app/Badges";
import { Button } from "@/components/ui/Button";
import { people, reviews, currentUser } from "@/data/mock";

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const user = people.find((p) => p.id === userId) ?? currentUser;

  return (
    <PhoneShell>
      <TopBar title={user.name} subtitle={`Joined ${user.joined}`} back onBack={() => router.back()} />
      <Screen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
          <View style={[styles.card, { alignItems: "center" }]}>
            <Avatar size={96} src={user.photo} name={user.name} ring="primarySoft" />
            <AppText size="xl" family="display" weight={800} style={{ marginTop: 12 }}>
              {user.name}
            </AppText>
            <View style={{ marginTop: 8 }}>
              <VerificationBadges items={user.verifications} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatBlock label="Rating" value={user.rating.toFixed(1)} />
            <StatBlock label="Reliability" value={`${user.reliability}%`} />
            <StatBlock label="Rides" value={`${user.rides}`} />
          </View>

          <View style={{ gap: 12 }}>
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
                <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 8 }}>
                  {r.text}
                </AppText>
              </View>
            ))}
          </View>

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
