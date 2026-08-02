import { useState } from "react";
import { View } from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  /** Defaults to "destructive" styling. */
  tone?: "default" | "destructive" | "secondary";
  /** When true, shows a required reason field. */
  requireReason?: boolean;
  reasonPlaceholder?: string;
  busy?: boolean;
  error?: string | null;
  /** Optional extra content (e.g. duration picker) above the reason field. */
  children?: React.ReactNode;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

/** Shared confirm dialog for admin enforcement actions (reason optional). */
export function ActionDialog({
  visible,
  title,
  body,
  confirmLabel,
  tone = "destructive",
  requireReason = false,
  reasonPlaceholder = "Reason (recorded in the audit log)…",
  busy,
  error,
  children,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");

  const submit = () => {
    if (requireReason && !reason.trim()) return;
    onConfirm(reason.trim());
  };

  const confirmDisabled = busy || (requireReason && !reason.trim());

  return (
    <Dialog visible={visible} onClose={busy ? () => {} : onClose} title={title}>
      {body ? (
        <AppText size="xs" color={colors.mutedForeground} style={{ marginBottom: 12, lineHeight: 18 }}>
          {body}
        </AppText>
      ) : null}
      {children}
      <Textarea
        value={reason}
        onChangeText={setReason}
        placeholder={reasonPlaceholder}
        editable={!busy}
        style={{ minHeight: 80 }}
      />
      {error ? (
        <AppText size="xs" color={colors.destructive} style={{ marginTop: 8 }}>
          {error}
        </AppText>
      ) : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Button variant="outline" onPress={onClose} disabled={busy} style={{ flex: 1, height: 44, borderRadius: radius.lg }}>
          Cancel
        </Button>
        <Button
          variant={tone === "default" ? "default" : tone === "secondary" ? "secondary" : "destructive"}
          onPress={submit}
          disabled={confirmDisabled}
          style={{ flex: 1, height: 44, borderRadius: radius.lg }}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </View>
    </Dialog>
  );
}
