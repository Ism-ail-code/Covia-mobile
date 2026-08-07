/**
 * OtpInput — a 6-digit one-time password entry field.
 *
 * One invisible TextInput sits behind a row of boxes: typing fills the
 * boxes left to right, backspace walks back, pasted codes fill in whole,
 * and the code auto-submits (via `onComplete`) once the last digit lands.
 * `textContentType="oneTimeCode"` lets iOS offer SMS-style autofill.
 */

import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";

const LENGTH = 6;

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  hasError,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (value.length === LENGTH) {
      // Let the last digit render before submitting.
      const t = setTimeout(() => onComplete?.(value), 120);
      return () => clearTimeout(t);
    }
  }, [value, onComplete]);

  useEffect(() => {
    if (hasError) {
      shake.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
  }, [hasError, shake]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      disabled={disabled}
      accessibilityLabel={`${LENGTH}-digit code`}
      accessibilityHint="Type the code from your email"
    >
      <Animated.View
        style={[
          { flexDirection: "row", justifyContent: "center", gap: 10 },
          shakeStyle,
        ]}
      >
        {digits.map((digit, i) => {
          const isActive = focused && i === value.length;
          return (
            <View
              key={i}
              style={{
                width: 46,
                height: 56,
                borderRadius: radius.md,
                borderWidth: hasError
                  ? 1.5
                  : isActive
                    ? 1.5
                    : 1,
                borderColor: hasError
                  ? colors.destructive
                  : isActive
                    ? colors.primary
                    : colors.input,
                backgroundColor: colors.card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText size="28" family="display" weight={700}>
                {digit}
              </AppText>
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const digitsOnly = text.replace(/\D/g, "").slice(0, LENGTH);
          onChange(digitsOnly);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        caretHidden
        maxLength={LENGTH}
        style={{
          position: "absolute",
          opacity: 0,
          height: 56,
          width: "100%",
        }}
      />
    </Pressable>
  );
}
