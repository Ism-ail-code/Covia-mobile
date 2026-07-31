import { useEffect, useRef, useState } from "react";
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radius, sans } from "@/theme";
import { cn } from "@/lib/cn";

type Props = {
  length?: number;
  value?: string;
  onChangeValue?: (v: string) => void;
  onComplete?: (v: string) => void;
  /** Slot style: web used h-13 w-11 rounded-xl border text-lg font-semibold. */
  slotStyle?: ViewStyle;
};

/** 6-slot one-time code input, mirrors the web InputOTP. */
export function OTPInput({
  length = 6,
  value: controlled,
  onChangeValue,
  onComplete,
  slotStyle,
}: Props) {
  const [internal, setInternal] = useState("");
  const value = controlled ?? internal;
  const refs = useRef<Array<TextInput | null>>([]);

  const setValue = (v: string) => {
    setInternal(v);
    onChangeValue?.(v);
  };

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  const focus = (i: number) => refs.current[i]?.focus();

  const handleKey = (i: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === "Backspace") {
      e.preventDefault?.();
      if (value[i]) {
        setValue(value.slice(0, i) + " " + value.slice(i + 1));
        focus(i);
      } else if (i > 0) {
        focus(i - 1);
      }
    }
  };

  const slots = Array.from({ length }).map((_, i) => value[i] ?? "");

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {slots.map((char, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={char === " " ? "" : char}
          maxLength={1}
          keyboardType="number-pad"
          autoFocus={i === 0}
          selectTextOnFocus
          onChangeText={(t) => {
            const next = t.replace(/[^0-9]/g, "").slice(-1);
            setValue(value.slice(0, i) + next + value.slice(i + 1));
            if (next) focus(Math.min(i + 1, length - 1));
          }}
          onKeyPress={(e) => handleKey(i, e)}
          style={[
            {
              width: 44,
              height: 52,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.xl,
              textAlign: "center",
              fontSize: 18,
              fontFamily: sans(600),
              color: colors.foreground,
              backgroundColor: colors.card,
            },
            slotStyle,
            char && { borderColor: colors.primary },
          ]}
        />
      ))}
    </View>
  );
}
