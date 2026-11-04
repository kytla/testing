import { Slot } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-paper">
      {/* pt-5 (20) plus the notch/status bar height */}
      <View
        className="w-full items-center justify-center px-5 pb-3"
        style={{ paddingTop: insets.top + 20 }}
      >
        <View className="flex-row items-center gap-2">
          <View className="rotate-[-2deg] rounded-[3px] bg-mahogany px-2 py-1">
            <Text className="font-mono text-xs font-semibold text-card">CTU</Text>
          </View>
          <Text className="font-display text-lg font-extrabold tracking-tight text-burgundy">
            Confessions
          </Text>
        </View>
      </View>

      <View className="w-full flex-1">
        <Slot />
      </View>

      {/* max(safe-area-inset-bottom, 16px) */}
      <View
        className="w-full px-5 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <BottomNav />
      </View>
    </View>
  );
}
