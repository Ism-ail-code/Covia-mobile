import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Mic, Paperclip, Send } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { chatMessages, type ChatMessage } from "@/data/mock";

function Bubble({ m }: { m: ChatMessage }) {
  if (m.announcement) {
    return (
      <View style={{ alignSelf: "center", maxWidth: "80%", borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6 }}>
        <AppText size="xs" weight={500} color={colors.primary} style={{ fontSize: 11, textAlign: "center" }}>
          {m.text}
        </AppText>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: m.mine ? "row-reverse" : "row", gap: 8 }}>
      {!m.mine && m.author ? (
        <Avatar size={28} src={m.author.photo} name={m.author.name} style={{ alignSelf: "flex-end" }} />
      ) : (
        <View style={{ width: 28 }} />
      )}
      <View style={{ maxWidth: "76%", alignItems: m.mine ? "flex-end" : "flex-start" }}>
        {!m.mine && m.author ? (
          <AppText size="xs" weight={600} color={colors.mutedForeground} style={{ marginBottom: 2, paddingHorizontal: 4, fontSize: 10 }}>
            {m.author.name}
          </AppText>
        ) : null}
        <View
          style={{
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: m.mine ? colors.primary : colors.card,
            borderBottomLeftRadius: m.mine ? 16 : 4,
            borderBottomRightRadius: m.mine ? 4 : 16,
            ...(m.mine ? {} : { borderWidth: 1, borderColor: colors.border }),
          }}
        >
          <AppText size="sm" color={m.mine ? colors.primaryForeground : colors.foreground}>
            {m.text}
          </AppText>
        </View>
        <AppText size="xs" color={colors.mutedForeground} style={{ marginTop: 4, paddingHorizontal: 4, fontSize: 10 }}>
          {m.time}
        </AppText>
      </View>
    </View>
  );
}

export default function Chat() {
  const router = useRouter();
  const [text, setText] = useState("");

  return (
    <PhoneShell>
      <TopBar title="Maple Court → VI" subtitle="4 companions · departs 08:15" back onBack={() => router.back()} />
      <Screen>
        <ScrollView
          style={{ flex: 1, backgroundColor: `${colors.surface}99` }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          {chatMessages.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4 }}>
            <View style={{ flexDirection: "row", gap: 2 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: colors.mutedForeground }} />
              ))}
            </View>
            <AppText size="xs" color={colors.mutedForeground} style={{ fontSize: 11 }}>
              Fatima is typing…
            </AppText>
          </View>
        </ScrollView>
      </Screen>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        <IconButton accessibilityLabel="Attach" style={{ height: 40, width: 40, borderRadius: 999, backgroundColor: "transparent" }}>
          <Paperclip size={20} color={colors.mutedForeground} />
        </IconButton>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message companions…"
          placeholderTextColor={colors.mutedForeground}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            paddingHorizontal: 14,
            fontSize: 14,
            color: colors.foreground,
          }}
        />
        <IconButton accessibilityLabel="Voice note" style={{ height: 40, width: 40, borderRadius: 999, backgroundColor: "transparent" }}>
          <Mic size={20} color={colors.mutedForeground} />
        </IconButton>
        <IconButton accessibilityLabel="Send" style={{ height: 44, width: 44, borderRadius: 16, backgroundColor: colors.primary }}>
          <Send size={18} color={colors.primaryForeground} />
        </IconButton>
      </View>
    </PhoneShell>
  );
}
