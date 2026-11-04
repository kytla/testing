import { format } from "date-fns";
import { useRouter } from "expo-router";
import { CalendarDays, ShieldCheck, Tag } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { toast } from "sonner-native";
import { useConfessions } from "../../contexts/ConfessionContext";
import { categories } from "../../data/categories";
import { categoryStyles } from "../../data/categoryStyles";
import type { ConfessionCategory } from "../../types/confession";

// Icons and placeholders can't read Tailwind classes. Use the real `muted` hex from your tailwind config.
const MUTED = "#7A5650"; // text-muted
const PLACEHOLDER = "#7A565099"; // text-muted/60 (99 = 60% opacity)

const MAX_LENGTH = 400;
const pressTransition = {
  duration: 120,
  easing: Easing.bezier(0.23, 1, 0.32, 1),
};

export default function Post() {
  const { addPost, nextNumber } = useConfessions();
  const router = useRouter();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<ConfessionCategory | null>(null);
  const [touched, setTouched] = useState(false);

  // Replaces `whileTap={canPost ? { scale: 0.97 } : undefined}`
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const trimmed = text.trim();
  const canPost = trimmed.length >= 5 && category !== null;
  const remaining = MAX_LENGTH - text.length;

  const handleSubmit = () => {
    setTouched(true);
    if (!canPost || !category) return;
    const post = addPost(trimmed, category);
    toast.success(`Posted as Anonymous #${post.number}`, {
      description: "Your confession is now live.",
    });
    router.navigate("/profile");
  };

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets // iOS: scrolls the focused field above the keyboard
      showsVerticalScrollIndicator={false}
      // mx-auto w-full max-w-xl px-5 pb-12 pt-4
      contentContainerStyle={{
        width: "100%",
        maxWidth: 576,
        alignSelf: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 48,
      }}
    >
      <Text
        accessibilityRole="header"
        className="font-display text-2xl font-extrabold tracking-tight text-burgundy"
      >
        New confession
      </Text>

      <View className="mt-5 rounded-[4px] border-[1.5px] border-burgundy bg-card p-5 shadow-stack sm:p-8">
        <View className="gap-1.5">
          <View className="flex-row items-center gap-3">
            <View className="rotate-[-2deg] rounded-[3px] border-2 border-mahogany px-2 py-0.5">
              <Text className="font-mono text-sm font-semibold text-mahogany">#{nextNumber}</Text>
            </View>
            <Text className="font-display text-sm font-bold text-burgundy">Posting as Anonymous</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <CalendarDays color={MUTED} size={16} />
            <Text className="font-display text-sm text-muted">
              {format(new Date(), "MMM d, yyyy")}
            </Text>
          </View>
        </View>

        <TextInput
          accessibilityLabel="Your confession"
          value={text}
          onChangeText={setText}
          maxLength={MAX_LENGTH}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholder="Unsa imong gusto i-confess?"
          placeholderTextColor={PLACEHOLDER}
          className="mt-6 min-h-[168px] w-full border-l-2 border-mahogany bg-transparent pl-3 font-serif text-xl font-medium leading-[28px] tracking-tight text-ink sm:min-h-[198px] sm:text-2xl"
        />
        <Text
          accessibilityLiveRegion="polite"
          className={`text-right font-mono text-xs ${remaining < 40 ? "text-heart" : "text-muted"}`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {remaining}
        </Text>

        <View className="mt-4 border-t border-dashed border-line pt-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-1.5 shrink-0">
              <Tag color={MUTED} size={16} />
            </View>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Category"
              className="flex-1 flex-row flex-wrap gap-1.5"
            >
              {categories.map((c) => {
                const active = category === c;
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => setCategory(c)}
                    className={`rounded-[5px] border px-3 py-2 ${
                      active
                        ? `border-ink ${categoryStyles[c]}`
                        : "border-line active:border-ink"
                    }`}
                  >
                    <Text className="font-display text-sm font-medium text-ink">
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {touched && !category && (
            <Text className="mt-2 pl-7 font-display text-xs text-heart">
              Pick a category.
            </Text>
          )}
        </View>
      </View>

      <View className="mt-5 flex-row items-start gap-3">
        <View className="mt-0.5 shrink-0">
          <ShieldCheck color={MUTED} size={16} />
        </View>
        <Text className="flex-1 font-display text-xs leading-relaxed text-muted">
          Nobody can see who posted this. Be kind — confessions that name or
          target people can be reported and removed by admins.
        </Text>
      </View>

      <Animated.View style={scaleStyle} className="mt-6 w-full">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canPost }}
          disabled={!canPost}
          onPress={handleSubmit}
          onPressIn={() => {
            if (canPost) scale.value = withTiming(0.97, pressTransition);
          }}
          onPressOut={() => {
            scale.value = withTiming(1, pressTransition);
          }}
          className={`w-full items-center rounded-[8px] border-2 border-b-[5px] border-burgundy bg-mahogany py-3.5 ${canPost ? "" : "opacity-30"}`}
        >
          <Text className="font-display text-[15px] font-bold text-card">
            Post anonymously
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
