import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";

type TabDef<T extends string> = {
  value: T;
  label?: string;
  icon?: React.ReactNode;
};

type Props<T extends string> = {
  tabs: Array<TabDef<T>>;
  value: T;
  onChange?: (v: T) => void;
  /** Columns for a full-width grid (web grid-cols-N). */
  columns?: number;
  style?: StyleProp<ViewStyle>;
};

/** Segmented control mirroring the web Tabs (muted track, card active pill). */
export function Tabs<T extends string>({ tabs, value, onChange, columns, style }: Props<T>) {
  const grid = columns && columns > 0;
  return (
    <View
      style={[
        {
          flexDirection: grid ? "row" : "row",
          flexWrap: grid ? "wrap" : "nowrap",
          backgroundColor: colors.muted,
          borderRadius: radius.lg,
          padding: 4,
        },
        style,
      ]}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <Pressable
            key={t.value}
            onPress={() => onChange?.(t.value)}
            style={[
              {
                flex: grid ? 1 / columns : undefined,
                minWidth: grid ? undefined : 64,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
                borderRadius: radius.xl,
                paddingVertical: 8,
                paddingHorizontal: grid ? 4 : 12,
                backgroundColor: active ? colors.card : "transparent",
                shadowColor: active ? "#000" : "transparent",
                shadowOpacity: active ? 0.08 : 0,
                shadowRadius: active ? 6 : 0,
                shadowOffset: active ? { width: 0, height: 2 } : { width: 0, height: 0 },
                elevation: active ? 2 : 0,
              },
            ]}
          >
            {t.icon}
            {t.label ? (
              <AppText
                size="xs"
                weight={active ? 600 : 400}
                color={active ? colors.foreground : colors.mutedForeground}
              >
                {t.label}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
