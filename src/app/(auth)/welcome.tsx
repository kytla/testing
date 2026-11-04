import { useRouter } from "expo-router";
import { CalendarDays, Lock, UserRound } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { categoryStyles } from "../../data/categoryStyles";

// Icons can't read Tailwind classes. Use the real `muted` hex from your tailwind config.
const MUTED = "#7A5650";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  // Replaces `initial={reduceMotion ? false : { opacity: 0, y: 12 }}` + `animate`
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 12);

  useEffect(() => {
    if (reduceMotion) return;
    const config = { duration: 280, easing: Easing.bezier(0.23, 1, 0.32, 1) };
    opacity.value = withDelay(50, withTiming(1, config));
    translateY.value = withDelay(50, withTiming(0, config));
  }, [reduceMotion, opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ScrollView
      className="flex-1 bg-paper"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1, // replaces min-h-full
        paddingTop: insets.top + 48, // pt-12 plus the notch/status bar
        paddingBottom: Math.max(insets.bottom, 24), // max(safe-area-inset-bottom, 24px)
        paddingHorizontal: 20,
      }}
    >
      <View className="w-full max-w-md flex-1 self-center">
        <View className="flex-1 justify-center">
          <View className="mb-5 self-start rotate-[-2deg] rounded-[3px] border-2 border-mahogany px-2.5 py-1">
            <Text className="font-mono text-xs font-semibold tracking-widest text-mahogany">
              100% ANONYMOUS
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            className="font-display text-[42px] font-extrabold leading-[0.95] tracking-tight text-burgundy sm:text-5xl"
          >
            {"CTU"}{"\n"}{"Confessions"}
          </Text>
          <Text className="mt-3 font-display text-base text-muted">
            Your stories, your campus, your voice.
          </Text>

          {/* Decorative sample card: hidden from screen readers, like aria-hidden */}
          <Animated.View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="relative mt-10"
            style={cardStyle}
          >
            <View className="absolute inset-x-3 -bottom-2 top-2 rounded-[6px] border border-line bg-card" />
            <View className="relative rounded-[4px] border-[1.5px] border-burgundy bg-card p-6 shadow-stack">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-1.5">
                  <View className="flex-row items-center gap-3">
                    <UserRound color={MUTED} size={16} />
                    <Text className="font-display text-sm font-medium text-ink">
                      Anonymous #125
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <CalendarDays color={MUTED} size={16} />
                    <Text className="font-display text-sm text-muted">
                      Oct 9, 2026
                    </Text>
                  </View>
                </View>
                <View
                  className={`rounded-[4px] px-2 py-0.5 ${categoryStyles.Crush}`}
                >
                  <Text className="font-display text-xs font-medium text-ink">
                    Crush
                  </Text>
                </View>
              </View>
              <Text className="mt-6 font-serif text-xl font-medium leading-snug tracking-tight text-ink">
                “Naa koy crush sa library pero wala pa gyud ko kabalo sa iyang
                pangalan.”
              </Text>
            </View>
          </Animated.View>
        </View>

        <View className="mt-12 gap-3">
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/(auth)/register")}
            className="h-[50px] w-full items-center justify-center rounded-[8px] border-2 border-burgundy border-b-[5px] bg-mahogany active:opacity-90"
          >
            <Text className="font-display text-[15px] font-bold text-card">
              Create Account
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/(auth)/login")}
            className="h-[50px] w-full items-center justify-center rounded-[8px] border-2 border-burgundy bg-transparent active:bg-wheat"
          >
            <Text className="font-display text-sm font-semibold text-ink">
              Log In
            </Text>
          </Pressable>
          <View className="flex-row items-center justify-center gap-2 pt-2">
            <Lock color={MUTED} size={14} />
            <Text className="shrink text-center font-display text-xs text-muted">
              Your name stays private. Every post shows as Anonymous.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
