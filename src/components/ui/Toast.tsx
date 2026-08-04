import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { X, CheckCircle2, AlertCircle } from "lucide-react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadows } from "@/theme";
import { AppText } from "./AppText";

type ToastType = "success" | "error";
type ToastItem = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastApi = {
  success: (title: string, opts?: { description?: string }) => void;
  error: (title: string, opts?: { description?: string }) => void;
};

const ToastContext = createContext<ToastApi>({ success: () => {}, error: () => {} });

export const useToast = () => useContext(ToastContext);

/** Lightweight sonner-style toasts (top-center, rich colors). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const insets = useSafeAreaInsets();

  const push = useCallback((type: ToastType, title: string, description?: string) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev.slice(-2), { id, type, title, description }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const api: ToastApi = {
    success: (t, o) => push("success", t, o?.description),
    error: (t, o) => push("error", t, o?.description),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 100,
        }}
      >
        {items.map((t) => {
          const success = t.type === "success";
          const bg = success ? colors.successSoft : colors.destructiveSoft;
          const fg = success ? colors.success : colors.destructive;
          return (
            <Animated.View
              key={t.id}
              entering={FadeInDown.springify().damping(18)}
              exiting={FadeOutUp}
              style={[
                {
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  maxWidth: "88%",
                  borderWidth: 1,
                  borderColor: `${fg}44`,
                  backgroundColor: bg,
                  borderRadius: radius["2xl"],
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 8,
                  ...shadows.soft,
                },
              ]}
            >
              {success ? (
                <CheckCircle2 size={18} color={fg} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={18} color={fg} strokeWidth={2.5} />
              )}
              <View style={{ flex: 1 }}>
                <AppText size="sm" weight={600} color={fg}>
                  {t.title}
                </AppText>
                {t.description ? (
                  <AppText size="xs" color={colors.foreground} style={{ opacity: 0.85, marginTop: 2 }}>
                    {t.description}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                accessibilityLabel="Dismiss"
                accessibilityRole="button"
              >
                <X size={14} color={fg} />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}
