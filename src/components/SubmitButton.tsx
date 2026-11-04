import React from "react";
import { Pressable, Text } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { Spinner } from "./Spinner";

// Icons can't read Tailwind classes. Use the real `card` hex from your tailwind config.
const CARD = "#FFFAF1"; // text-card

interface SubmitButtonProps {
  loading: boolean;
  loadingLabel: string;
  onPress: () => void;
  children: React.ReactNode;
}

const pressTransition = {
  duration: 120,
  easing: Easing.bezier(0.23, 1, 0.32, 1),
};

export function SubmitButton({
  loading,
  loadingLabel,
  onPress,
  children,
}: SubmitButtonProps) {
  // Replaces `whileTap={loading ? undefined : { scale: 0.97 }}`
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={scaleStyle} className="w-full">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: loading }}
        disabled={loading}
        onPress={onPress}
        onPressIn={() => {
          if (!loading) scale.value = withTiming(0.97, pressTransition);
        }}
        onPressOut={() => {
          scale.value = withTiming(1, pressTransition);
        }}
        className={`h-[50px] w-full flex-row items-center justify-center gap-2 rounded-[8px] border-2 border-b-[5px] border-burgundy bg-mahogany px-5 ${
          loading ? "opacity-70" : "active:opacity-90"
        }`}
      >
        {loading && <Spinner color={CARD} size={16} />}
        <Text
          numberOfLines={1}
          className="font-display text-[15px] font-bold text-card"
        >
          {loading ? loadingLabel : children}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
