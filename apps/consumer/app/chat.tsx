import { useRef, useState } from "react";
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@rapidual/ui";
import { useRouter } from "expo-router";
import { colors } from "@/theme/tokens";
import { INITIAL_THREAD, QUICK_REPLIES, cannedReply, type ChatMessage } from "@/mock/chat";

const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function Chat() {
  const router = useRouter();
  const [thread, setThread] = useState<ChatMessage[]>(INITIAL_THREAD);
  const [input, setInput] = useState("");
  const scroller = useRef<ScrollView>(null);

  const send = (text: string) => {
    const body = text.trim();
    if (!body) return;
    const mine: ChatMessage = { id: `u${Date.now()}`, role: "user", text: body, at: now() };
    setThread((t) => [...t, mine]);
    setInput("");
    setTimeout(() => {
      setThread((t) => [...t, { id: `a${Date.now()}`, role: "agent", text: cannedReply(body), at: now() }]);
    }, 900);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy900 }} edges={["top", "bottom"]}>
      <View className="flex-row items-center px-5 py-3 border-b border-navy-600/60">
        <Pressable onPress={() => router.back()} className="mr-3"><Ionicons name="chevron-back" size={26} color={colors.ink} /></Pressable>
        <View className="w-10 h-10 rounded-full bg-orange-500/15 items-center justify-center">
          <Text className="text-orange-400 font-bold">M</Text>
        </View>
        <View className="ml-3">
          <Text variant="heading" className="text-base">Maya</Text>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-success mr-1.5" />
            <Text variant="caption">Your driver · online</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scroller}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          {thread.map((m) => {
            const mine = m.role === "user";
            return (
              <View key={m.id} className={`mb-3 max-w-[80%] ${mine ? "self-end items-end" : "self-start items-start"}`}>
                <View className={`rounded-2xl px-4 py-2.5 ${mine ? "bg-orange-500 rounded-br-md" : "bg-navy-700 border border-navy-600/60 rounded-bl-md"}`}>
                  <Text className={mine ? "text-white" : "text-ink"}>{m.text}</Text>
                </View>
                <Text variant="caption" className="mt-1 text-ink-faint">{m.at}</Text>
              </View>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-2" style={{ maxHeight: 44 }}>
          {QUICK_REPLIES.map((q) => (
            <Pressable key={q} onPress={() => send(q)} className="rounded-full bg-navy-700 border border-navy-600/60 px-3 py-2 mr-2">
              <Text className="text-ink-muted text-sm">{q}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="flex-row items-center px-5 pb-2 pt-1">
          <View className="flex-1 flex-row items-center rounded-full bg-navy-700 border border-navy-600/60 px-4 py-2.5">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message your driver…"
              placeholderTextColor={colors.inkFaint}
              style={{ flex: 1, color: colors.ink, fontSize: 15 }}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
            />
          </View>
          <Pressable onPress={() => send(input)} className="w-11 h-11 rounded-full bg-orange-500 items-center justify-center ml-2">
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
