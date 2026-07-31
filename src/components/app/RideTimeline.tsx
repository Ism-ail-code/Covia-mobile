import { View } from "react-native";
import { Check, Loader2 } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PulseDot } from "@/components/ui/animations";
import type { TimelineStep } from "@/data/mock";

export function RideTimeline({ steps, current }: { steps: TimelineStep[]; current: number }) {
  return (
    <View>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const pending = !done && !active;
        return (
          <View key={step.label} style={{ flexDirection: "row", gap: 12 }}>
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
              {i < steps.length - 1 ? (
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
            <View style={{ flex: 1, minWidth: 0, paddingBottom: i === steps.length - 1 ? 0 : 20 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                {active ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <AppText size="sm" weight={600}>
                      {step.label}
                    </AppText>
                    <PulseDot size={6} ringDistance={7} />
                  </View>
                ) : (
                  <AppText size="sm" weight={600} color={pending ? colors.mutedForeground : colors.foreground}>
                    {step.label}
                  </AppText>
                )}
                <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
                  {step.time}
                </AppText>
              </View>
              <AppText size="xs" color={colors.mutedForeground}>
                {step.detail}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}
