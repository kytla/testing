import {
    BottomSheetTextInput,
    type BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import { SendHorizontal } from "lucide-react-native";
import { cssInterop } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import type { ConfessionComment } from "../types/confession";
import { Sheet } from "./Sheet";

// Lets `className` work on the sheet's TextInput, which is a third-party wrapper.
cssInterop(BottomSheetTextInput, { className: "style" });

// Icons and placeholders can't read Tailwind classes. Use your real hex values.
const CARD = "#FFFAF1"; // card
const MUTED = "#7A5650"; // muted

interface CommentsSheetProps {
  comments: ConfessionComment[];
  open: boolean;
  onClose: () => void;
  onAdd: (text: string) => void;
}

const ease = Easing.bezier(0.23, 1, 0.32, 1);
const MAX_LENGTH = 280;

export function CommentsSheet({
  comments,
  open,
  onClose,
  onAdd,
}: CommentsSheetProps) {
  const scrollRef = useRef<BottomSheetScrollViewMethods>(null);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const prevCount = useRef(comments.length);

  // Send button press scale (replaces whileTap).
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Scroll to the newest comment when one is added.
  useEffect(() => {
    if (comments.length > prevCount.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
    prevCount.current = comments.length;
  }, [comments.length]);

  useEffect(() => {
    if (!open) setDraft("");
  }, [open]);

  const trimmed = draft.trim();

  const handleSubmit = () => {
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      titleId="comments-title"
      title={`Comments · ${comments.length}`}
      scrollRef={scrollRef}
      footer={
        <View className="flex-row items-center gap-2 border-t border-dashed border-line bg-card px-4 py-3 sm:px-6">
          <BottomSheetTextInput
            accessibilityLabel="Write a comment"
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            blurOnSubmit={false} // keep the keyboard open after sending
            maxLength={MAX_LENGTH}
            autoComplete="off"
            placeholder="Comment anonymously…"
            placeholderTextColor={MUTED}
            className={`min-w-0 flex-1 rounded-[6px] border border-b-[3px] border-orchid bg-card px-4 py-2.5 font-display text-sm text-ink ${
              focused ? "border-ink" : "border-line"
            }`}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            accessibilityState={{ disabled: !trimmed }}
            disabled={!trimmed}
            onPress={handleSubmit}
            onPressIn={() => {
              scale.value = withTiming(0.92, { duration: 120, easing: ease });
            }}
            onPressOut={() => {
              scale.value = withTiming(1, { duration: 120, easing: ease });
            }}
          >
            <Animated.View
              style={scaleStyle}
              className={`h-10 w-10 items-center justify-center rounded-[6px] bg-ink ${trimmed ? "" : "opacity-30"}`}
            >
              <SendHorizontal color={CARD} size={16} />
            </Animated.View>
          </Pressable>
        </View>
      }
    >
      {comments.length === 0 ? (
        <Text className="py-10 text-center font-display text-sm text-muted">
          No comments yet. Be the first to reply.
        </Text>
      ) : (
        comments.map((c, i) => {
          const isNew = c.time === "now";
          return (
            <Animated.View
              key={c.id}
              entering={
                isNew
                  ? FadeInDown.duration(200)
                      .easing(ease)
                      .withInitialValues({
                        opacity: 0,
                        transform: [{ translateY: 6 }],
                      })
                  : undefined
              }
              className={`py-4 ${i > 0 ? "border-t border-line" : ""}`}
            >
              <View className="mb-1 flex-row items-baseline justify-between gap-4">
                <Text
                  className={`font-display text-xs font-medium ${isNew ? "text-ink" : "text-muted"}`}
                >
                  {c.author}
                </Text>
                <Text className="font-display text-xs text-muted">{c.time}</Text>
              </View>
              <Text className="font-serif text-base leading-relaxed text-ink">
                {c.text}
              </Text>
            </Animated.View>
          );
        })
      )}
    </Sheet>
  );
}
