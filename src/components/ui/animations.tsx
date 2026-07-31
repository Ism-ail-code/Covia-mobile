import { useEffect } from "react";
import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@/theme";

const easeOut = Easing.out(Easing.cubic);

/** Screen-level fade-in (web `animate-[fade-in_0.3s]`). */
export function ScreenFade({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(300)}>
      {children}
    </Animated.View>
  );
}

/** `rise` keyframe: fade in + translateY(14px) → 0, with optional stagger delay. */
export function RiseIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 450, easing: easeOut }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 450, easing: easeOut }));
  }, [delay, opacity, translateY]);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}

/** Web `stagger` utility — rise with per-item delay. */
export function Stagger({
  index = 0,
  step = 60,
  children,
}: {
  index?: number;
  step?: number;
  children: React.ReactNode;
}) {
  return <RiseIn delay={index * step}>{children}</RiseIn>;
}

/** `scale-in` keyframe: fade in + scale 0.94 → 1. */
export function ScaleIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 250, easing: easeOut }));
    scale.value = withDelay(delay, withTiming(1, { duration: 250, easing: easeOut }));
  }, [delay, opacity, scale]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}

/** Pulsing ring dot — web `pulse-ring` keyframe (expanding ring). */
export function PulseDot({
  size = 8,
  color = colors.success,
  ringDistance = 12,
  duration = 2000,
  style,
  children,
}: {
  size?: number;
  color?: string;
  ringDistance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const ring = useSharedValue(0);
  const ringOpacity = useSharedValue(0.45);

  useEffect(() => {
    ring.value = withRepeat(
      withSequence(withTiming(1, { duration, easing: easeOut }), withTiming(0, { duration: 0 })),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration, easing: easeOut }), withTiming(0.45, { duration: 0 })),
      -1,
      false,
    );
  }, [ring, ringOpacity, duration]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring.value * (ringDistance / Math.max(1, size)) }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={[{ height: size, width: size }, style]}>
      <Animated.View
        style={[{ position: "absolute", height: size, width: size, borderRadius: 999, backgroundColor: color }, ringStyle]}
      />
      {children ?? (
        <View style={{ height: size, width: size, borderRadius: 999, backgroundColor: color }} />
      )}
    </View>
  );
}

/** Skeleton shimmer block (web `skeleton-shimmer`). */
export function Shimmer({
  width,
  height,
  radius = 999,
  style,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(0.55, { duration: 800 })), -1, true);
  }, [opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.muted }, anim, style]} />
  );
}
