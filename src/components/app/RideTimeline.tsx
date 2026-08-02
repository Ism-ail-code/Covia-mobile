import { View } from "react-native";
import { Check, Loader2 } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PulseDot } from "@/components/ui/animations";
import { RIDE_TIMELINE_LABELS, type RideTimelineEvent } from "@/types/ride";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });

export function RideTimeline({ events, current }: { events: RideTimelineEvent[]; current: number }) {
  if (!events.length) {
    return (
      <AppText size="xs" color={colors.mutedForeground}>
        No events yet.
      </AppText>
    );
  }
  return (
    <View>
      {events.map((event, i) => {
        const done = i < current;
        const active = i === current;
        const pending = !done && !active;
        const label = RIDE_TIMELINE_LABELS[event.eventType] ?? event.eventType;
        return (
          <View key={event.id} style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  height: 28,
                  width: 28,
                  borderRadius: radius.full,
                  borderWidth: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: done
                    ? colors.success
                    : active
                      ? colors.primary
                      : colors.border,
                  backgroundColor: done
                    ? colors.success
                    : active
                      ? colors.primary
                      : colors.card,
                }}
              >
                {done ? (
                  <Check size={14} color={colors.successForeground} strokeWidth={3} />
                ) : active ? (
                  <Loader2 size={14} color={colors.primaryForeground} />
                ) : (
                  <AppText size="xs" weight={700} color={colors.mutedForeground} style={{ fontSize: 10 }}>
                    {i + 1}
                  </AppText>
                )}
              </View>
              {i < events.length - 1 ? (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    marginVertical: 4,
                    backgroundColor: done ? `${colors.success}80` : colors.border,
                    borderRadius: 999,
                  }}
                />
              ) : null}
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingBottom: i === events.length - 1 ? 0 : 20 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                {active ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <AppText size="sm" weight={600}>
                      {label}
                    </AppText>
                    <PulseDot size={6} ringDistance={7} />
                  </View>
                ) : (
                  <AppText size="sm" weight={600} color={pending ? colors.mutedForeground : colors.foreground}>
                    {label}
                  </AppText>
                )}
                <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                  {formatTime(event.createdAt)}
                </AppText>
              </View>
              {event.actorDisplayName ? (
                <AppText size="xs" color={colors.mutedForeground}>
                  by {event.actorDisplayName}
                </AppText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
