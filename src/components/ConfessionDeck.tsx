import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { toast } from "sonner-native";
import { useConfessions } from "../contexts/ConfessionContext";
import { useConfessionDeck } from "../hooks/useConfessionDeck";
import type { Confession } from "../types/confession";
import { CommentsSheet } from "./CommentsSheet";
import { ConfessionCard } from "./ConfessionCard";
import { ReactionBar } from "./ReactionBar";
import { ReportSheet } from "./ReportSheet";

export type SwipeAxis = "vertical" | "horizontal";

interface ConfessionDeckProps {
  swipeAxis: SwipeAxis;
}

// Icons can't read Tailwind classes. Use the real `ink` hex from your tailwind config.
const INK = "#700D0A";

const TIMING = { duration: 280, easing: Easing.bezier(0.23, 1, 0.32, 1) };
const PRESS = { duration: 120, easing: Easing.bezier(0.23, 1, 0.32, 1) };
const SWIPE_OFFSET = 80;
const SWIPE_VELOCITY = 500;
const ELASTIC = 0.6; // dragElastic
const ENTER_OFFSET = 24;
const EXIT_DISTANCE = 420;
const LG_BREAKPOINT = 1024; // Tailwind's `lg`

// One entry per card on screen: the current one, plus any that are still flying away.
interface CardEntry {
  key: string;
  confession: Confession;
  enterDirection: number;
  animateIn: boolean;
  leavingDirection: number | null;
}

export function ConfessionDeck({ swipeAxis }: ConfessionDeckProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [hasSwiped, setHasSwiped] = useState(false);
  const { getReaction, toggleReaction, getComments, addComment, reportPost } =
    useConfessions();
  const { current, index, total, direction, next, prev } = useConfessionDeck(
    !commentsOpen && !reportOpen,
  );
  const reduceMotion = useReducedMotion();
  const vertical = swipeAxis === "vertical";
  const showArrows = width >= LG_BREAKPOINT; // replaces `hidden lg:flex`

  // --- Stand-in for AnimatePresence -------------------------------------------------
  // When the current confession changes, the old card is kept in the list and told which
  // way to leave. It removes itself when its exit animation finishes.
  const keyCounter = useRef(0);
  const currentId = current?.id ?? null;
  const [trackedId, setTrackedId] = useState<string | null>(currentId);
  const [cards, setCards] = useState<CardEntry[]>(() =>
    current
      ? [
          {
            key: `${current.id}:0`,
            confession: current,
            enterDirection: direction,
            animateIn: false,
            leavingDirection: null,
          },
        ]
      : [],
  );

  if (currentId !== trackedId) {
    setTrackedId(currentId);
    const entryKey = `${currentId}:${++keyCounter.current}`;
    setCards((prevCards) =>
      current
        ? [
            ...prevCards.map((c) =>
              c.leavingDirection === null
                ? { ...c, leavingDirection: direction }
                : c,
            ),
            {
              key: entryKey,
              confession: current,
              enterDirection: direction,
              animateIn: prevCards.length > 0, // like `initial={false}`: no enter animation on first show
              leavingDirection: null,
            },
          ]
        : [],
    );
  }

  const removeCard = useCallback((key: string) => {
    setCards((c) => c.filter((x) => x.key !== key));
  }, []);

  // Replaces the `aria-live` region: announce the position after a swipe.
  useEffect(() => {
    if (hasSwiped && total > 0) {
      AccessibilityInfo.announceForAccessibility(
        `Confession ${index + 1} of ${total}`,
      );
    }
  }, [hasSwiped, index, total]);

  // All hooks are above this line. Do not add any below it.
  if (!current) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-center font-display text-lg font-semibold text-ink">
          You’re all caught up.
        </Text>
        <Text className="mt-2 text-center font-display text-sm text-muted">
          No confessions left to read right now.
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate("/post")}
          className="mt-6 rounded-[6px] bg-ink px-5 py-2.5"
        >
          <Text className="font-display text-sm font-semibold text-card">
            Write a confession
          </Text>
        </Pressable>
      </View>
    );
  }

  const comments = getComments(current);

  const goNext = () => {
    setHasSwiped(true);
    next();
  };
  const goPrev = () => {
    setHasSwiped(true);
    prev();
  };

  const handleReport = (
    reason: Parameters<typeof reportPost>[1],
    details: string,
  ) => {
    reportPost(current.id, reason, details);
    setReportOpen(false);
    toast.success("Report sent to admins", {
      description:
        "We’ve hidden this confession from your feed while it’s reviewed.",
    });
  };

  const PrevIcon = vertical ? ChevronUp : ChevronLeft;
  const NextIcon = vertical ? ChevronDown : ChevronRight;

  return (
    <View className="min-h-0 flex-1">
      <View className="flex-1 flex-row items-stretch justify-center gap-6">
        {showArrows && (
          <NavButton label="Previous confession" onPress={goPrev}>
            <PrevIcon color={INK} size={20} />
          </NavButton>
        )}

        <View className="max-w-xl flex-1">
          {/* The two "cards underneath" */}
          <View
            pointer-events-none
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            className="absolute inset-0 rounded-[6px] border-2 border-dashed border-line bg-card"
            style={{ transform: [{ translateY: 12 }, { scale: 0.94 }] }}
          />
          <View
            pointer-events-none
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            className="absolute inset-0 rounded-[6px] border-2 border-dashed border-line bg-card"
            style={{ transform: [{ translateY: 6 }, { scale: 0.97 }] }}
          />

          {cards.map((c) => {
            const active = c.leavingDirection === null;
            return (
              <DeckCard
                key={c.key}
                confession={active ? current : c.confession}
                vertical={vertical}
                reduceMotion={reduceMotion}
                animateIn={c.animateIn}
                enterDirection={c.enterDirection}
                leavingDirection={c.leavingDirection}
                canSwipe={total > 1}
                onSwipe={(dir) => (dir === "next" ? goNext() : goPrev())}
                onExited={() => removeCard(c.key)}
                onReport={() => setReportOpen(true)}
              />
            );
          })}
        </View>

        {showArrows && (
          <NavButton label="Next confession" onPress={goNext}>
            <NextIcon color={INK} size={20} />
          </NavButton>
        )}
      </View>

      <View className="mt-5 w-full max-w-xl self-center">
        <ReactionBar
          confession={current}
          reaction={getReaction(current.id)}
          commentCount={comments.length}
          onToggle={(key) => toggleReaction(current.id, key)}
          onOpenComments={() => setCommentsOpen(true)}
        />
      </View>

      <Text
        className="mt-2 h-5 text-center font-display text-xs text-muted"
        accessibilityLiveRegion="polite"
      >
        {hasSwiped
          ? ""
          : `Swipe ${vertical ? "up" : "left"} for the next confession`}
      </Text>

      <CommentsSheet
        comments={comments}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onAdd={(text) => addComment(current.id, text)}
      />
      <ReportSheet
        open={reportOpen}
        postNumber={current.number}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />
    </View>
  );
}

// ------------------------------------------------------------------------------------

interface DeckCardProps {
  confession: Confession;
  vertical: boolean;
  reduceMotion: boolean;
  animateIn: boolean;
  enterDirection: number;
  leavingDirection: number | null;
  canSwipe: boolean;
  onSwipe: (dir: "next" | "prev") => void;
  onExited: () => void;
  onReport: () => void;
}

function DeckCard({
  confession,
  vertical,
  reduceMotion,
  animateIn,
  enterDirection,
  leavingDirection,
  canSwipe,
  onSwipe,
  onExited,
  onReport,
}: DeckCardProps) {
  // Starting values = the web `enter` variant. Cards shown on first load start at rest.
  const translate = useSharedValue(
    animateIn && !reduceMotion
      ? enterDirection >= 0
        ? ENTER_OFFSET
        : -ENTER_OFFSET
      : 0,
  );
  const opacity = useSharedValue(animateIn ? 0 : 1);
  const scale = useSharedValue(animateIn && !reduceMotion ? 0.96 : 1);
  const rotate = useSharedValue(0);

  // Stable wrappers, so the gesture doesn't get rebuilt every render.
  const onSwipeRef = useRef(onSwipe);
  const onExitedRef = useRef(onExited);
  onSwipeRef.current = onSwipe;
  onExitedRef.current = onExited;
  const handleSwipe = useCallback(
    (dir: "next" | "prev") => onSwipeRef.current(dir),
    [],
  );
  const handleExited = useCallback(() => onExitedRef.current(), []);

  // enter -> center
  useEffect(() => {
    if (!animateIn) return;
    translate.value = withTiming(0, TIMING);
    opacity.value = withTiming(1, TIMING);
    scale.value = withTiming(1, TIMING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // center -> exit, starting from wherever the drag left the card
  useEffect(() => {
    if (leavingDirection === null) return;
    const dir = leavingDirection;
    if (!reduceMotion) {
      translate.value = withTiming(
        dir >= 0 ? -EXIT_DISTANCE : EXIT_DISTANCE,
        TIMING,
      );
      rotate.value = withTiming(vertical ? 0 : dir >= 0 ? -6 : 6, TIMING);
    }
    opacity.value = withTiming(0, TIMING, (finished) => {
      if (finished) runOnJS(handleExited)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leavingDirection]);

  const pan = useMemo(() => {
    const base = Gesture.Pan().enabled(leavingDirection === null);
    // Only start after real movement along the swipe axis, so taps (like the report button) still work.
    const configured = vertical
      ? base.activeOffsetY([-10, 10]).failOffsetX([-20, 20])
      : base.activeOffsetX([-10, 10]).failOffsetY([-20, 20]);

    return configured
      .onUpdate((e) => {
        translate.value =
          (vertical ? e.translationY : e.translationX) * ELASTIC;
      })
      .onEnd((e) => {
        const offset = vertical ? e.translationY : e.translationX;
        const velocity = vertical ? e.velocityY : e.velocityX;
        if (
          canSwipe &&
          (offset < -SWIPE_OFFSET || velocity < -SWIPE_VELOCITY)
        ) {
          runOnJS(handleSwipe)("next");
        } else if (
          canSwipe &&
          (offset > SWIPE_OFFSET || velocity > SWIPE_VELOCITY)
        ) {
          runOnJS(handleSwipe)("prev");
        } else {
          translate.value = withSpring(0, { damping: 22, stiffness: 260 }); // snap back (dragConstraints 0)
        }
      });
  }, [vertical, canSwipe, leavingDirection, handleSwipe, translate]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      vertical
        ? { translateY: translate.value }
        : { translateX: translate.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        className="absolute inset-0"
        style={[
          style,
          { pointerEvents: leavingDirection === null ? "auto" : "none" },
        ]}
      >
        <ConfessionCard confession={confession} onReport={onReport} />
      </Animated.View>
    </GestureDetector>
  );
}

// ------------------------------------------------------------------------------------

interface NavButtonProps {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}

function NavButton({ label, onPress, children }: NavButtonProps) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.92, PRESS);
      }}
      onPressOut={() => {
        scale.value = withTiming(1, PRESS);
      }}
      className="self-center"
    >
      <Animated.View
        style={scaleStyle}
        className="h-11 w-11 items-center justify-center rounded-[6px] border border-burgundy bg-card"
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
