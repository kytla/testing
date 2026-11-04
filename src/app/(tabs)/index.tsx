import { Text, View } from "react-native";
import {
    ConfessionDeck,
    type SwipeAxis,
} from "../../components/ConfessionDeck";

// A route file can't receive props, so the axis is a constant here.
// Change it to 'horizontal' if that's what your web app passed to <Home />.
const SWIPE_AXIS: SwipeAxis = "vertical";

export default function Home() {
  return (
    <View className="w-full max-w-3xl flex-1 self-center px-5 pb-2 pt-3">
      {/* Replaces `sr-only`: invisible, but still read by screen readers as the page heading */}
      <Text
        accessibilityRole="header"
        style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
      >
        Today’s confessions
      </Text>
      <ConfessionDeck swipeAxis={SWIPE_AXIS} />
    </View>
  );
}
