import { Loader2 } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

// Icons can't read Tailwind classes. Use the real `muted` hex from your tailwind config.
const MUTED = "#7A5650";

export function FullScreenLoader() {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  // Replaces `motion-safe:animate-spin`: only spin when reduced motion is off.
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(rotation);
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [reduceMotion, rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading your session…"
      accessibilityLiveRegion="polite"
      className="w-full flex-1 items-center justify-center gap-3 bg-paper"
    >
      <Text className="font-display text-lg font-extrabold tracking-tight text-burgundy">
        CTU-Confession
      </Text>
      <Animated.View style={spinStyle}>
        <Loader2 color={MUTED} size={20} />
      </Animated.View>
    </View>
  );
}
