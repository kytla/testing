import { Loader2 } from "lucide-react-native";
import { useEffect } from "react";
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

// Replaces `motion-safe:animate-spin`: only spins when reduced motion is off.
export function Spinner({ color, size }: { color: string; size: number }) {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);

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

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Loader2 color={color} size={size} />
    </Animated.View>
  );
}
