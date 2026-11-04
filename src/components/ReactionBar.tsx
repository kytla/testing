import {
    Frown,
    Heart,
    Laugh,
    MessageCircle,
    type LucideIcon,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import type { Confession, ReactionState } from "../types/confession";

// Icons can't read Tailwind classes. Use the real `ink` and `heart` hex values from your tailwind config.
const INK = "#700D0A"; // text-ink
const HEART = "#CA4333"; // text-heart / fill-heart

interface ReactionBarProps {
  confession: Confession;
  reaction: ReactionState;
  commentCount: number;
  onToggle: (key: keyof ReactionState) => void;
  onOpenComments: () => void;
}

interface ReactionButtonProps {
  icon: LucideIcon;
  count: number;
  label: string;
  pressed?: boolean;
  activeClass?: string;
  iconColor?: string;
  iconFill?: string;
  onPress: () => void;
}

const pressTransition = {
  duration: 120,
  easing: Easing.bezier(0.23, 1, 0.32, 1),
};

export function ReactionBar({
  confession,
  reaction,
  commentCount,
  onToggle,
  onOpenComments,
}: ReactionBarProps) {
  const hearts = confession.hearts + (reaction.heart ? 1 : 0);
  const laughs = confession.laughs + (reaction.laugh ? 1 : 0);
  const sads = confession.sads + (reaction.sad ? 1 : 0);

  return (
    <View className="w-full flex-row items-center justify-between gap-1 sm:justify-start sm:gap-3">
      <ReactionButton
        icon={Heart}
        count={hearts}
        label="Heart"
        pressed={reaction.heart}
        iconColor={reaction.heart ? HEART : INK}
        iconFill={reaction.heart ? HEART : "none"}
        onPress={() => onToggle("heart")}
      />
      <ReactionButton
        icon={Laugh}
        count={laughs}
        label="Haha"
        pressed={reaction.laugh}
        activeClass="bg-tag-funny"
        onPress={() => onToggle("laugh")}
      />
      <ReactionButton
        icon={Frown}
        count={sads}
        label="Sad"
        pressed={reaction.sad}
        activeClass="bg-tag-rant"
        onPress={() => onToggle("sad")}
      />
      <ReactionButton
        icon={MessageCircle}
        count={commentCount}
        label="Comments"
        onPress={onOpenComments}
      />
    </View>
  );
}

function ReactionButton({
  icon: Icon,
  count,
  label,
  pressed,
  activeClass = "",
  iconColor = INK,
  iconFill = "none",
  onPress,
}: ReactionButtonProps) {
  // Replaces `whileTap={{ scale: 0.9 }}`
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${count}`}
        accessibilityState={{ selected: pressed }}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.9, pressTransition);
        }}
        onPressOut={() => {
          scale.value = withTiming(1, pressTransition);
        }}
        className={`flex-row items-center gap-1.5 rounded-[6px] px-3 py-2 sm:gap-2 ${
          pressed ? activeClass : "active:bg-ink/5"
        }`}
      >
        <Icon color={iconColor} fill={iconFill} size={20} />
        <Text
          className="font-display text-sm text-ink sm:text-base"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {count}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
