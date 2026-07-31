import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "./AppText";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Centered modal mirroring the web Dialog (rounded-3xl, zoom-in). */
export function Dialog({ visible, onClose, title, children, style }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = visible ? withTiming(1, { duration: 220 }) : withTiming(0, { duration: 160 });
  }, [visible, progress]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[{ flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", padding: 28 }, overlayStyle]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            {
              width: "100%",
              maxWidth: 430,
              backgroundColor: colors.background,
              borderRadius: radius["2xl"],
              padding: 24,
              ...shadows.lifted,
            },
            contentStyle,
            style,
          ]}
        >
          {title ? (
            <View style={{ marginBottom: 12 }}>
              <AppText size="lg" family="display" weight={700}>
                {title}
              </AppText>
            </View>
          ) : null}
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
