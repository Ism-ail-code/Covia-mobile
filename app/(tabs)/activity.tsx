import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarX2 } from "lucide-react-native";
import { colors, gutter } from "@/theme";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Tabs } from "@/components/ui/Tabs";
import { RideCard } from "@/components/app/RideCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { AppText } from "@/components/ui/AppText";
import { Stagger } from "@/components/ui/animations";
import { rides, type Ride } from "@/data/mock";

const tabs: Array<{ value: Ride["status"]; label: string }> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Activity() {
  const router = useRouter();
  const [tab, setTab] = useState<Ride["status"]>("upcoming");
  const list = rides.filter((r) => r.status === tab);

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Activity" subtitle="Your rides, hosted and joined" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: gutter, paddingVertical: 16 }}>
          <Tabs
            columns={4}
            value={tab}
            onChange={setTab}
            tabs={tabs.map((t) => ({ value: t.value, label: t.label }))}
          />

          <View style={{ marginTop: 16, gap: 12 }}>
            {list.length ? (
              list.map((r, i) => (
                <Stagger key={r.id} index={i}>
                  <RideCard ride={r} />
                </Stagger>
              ))
            ) : (
              <EmptyState
                icon={<CalendarX2 size={28} color={colors.primary} />}
                title={`No ${tab} rides`}
                body="When you host or join a ride it will show up right here."
                action={
                  <Button block style={{ height: 48, borderRadius: 16, paddingHorizontal: 24 }} onPress={() => router.push("/explore")}>
                    <AppText size="sm" weight={600} color={colors.primaryForeground}>
                      Browse rides
                    </AppText>
                  </Button>
                }
              />
            )}
          </View>
        </ScrollView>
      </Screen>
    </PhoneShell>
  );
}
