import { useEffect } from "react";
import { Modal, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "./AppText";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Header title rendered above content (web SheetHeader). */
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Bottom sheet mirroring the web Sheet (rounded-t-3xl, slide from bottom). */
export function BottomSheet({ visible, onClose, title, children, style }: Props) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = visible ? withTiming(1, { duration: 250 }) : withTiming(0, { duration: 200 });
  }, [visible, progress]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 420 }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} accessibilityViewIsModal>
      <Animated.View style={[{ flex: 1, backgroundColor: colors.overlay }, overlayStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          style={[
            {
              backgroundColor: colors.background,
              borderTopLeftRadius: radius["2xl"],
              borderTopRightRadius: radius["2xl"],
              paddingBottom: insets.bottom + 20,
              ...shadows.lifted,
            },
            sheetStyle,
          ]}
        >
          <View style={{ alignItems: "center", paddingTop: 10 }}>
            <View
              style={{
                height: 4,
                width: 40,
                borderRadius: 999,
                backgroundColor: colors.border,
              }}
            />
          </View>
          {title ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
              <AppText size="lg" family="display" weight={700}>
                {title}
              </AppText>
            </View>
          ) : null}
          <View style={style}>{children}</View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
