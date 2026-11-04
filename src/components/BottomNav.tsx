import { usePathname, useRouter } from "expo-router";
import {
  Compass,
  House,
  SquarePen,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Icons can't read Tailwind classes. Use the real `ink` and `card` hex values from your tailwind config.
const INK = "#700D0A"; // text-ink
const CARD = "#FFFAF1"; // text-card (icon color on the active pill)

type Path = "/" | "/explore" | "/post" | "/profile";

interface NavItem {
  to: Path;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/post", label: "Create", icon: SquarePen },
  { to: "/profile", label: "Profile", icon: UserRound },
];

// Same rule as react-router's NavLink: `end` means exact match, otherwise prefix match.
function isPathActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

type ItemLayout = { x: number; width: number };

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  // All four destinations remain labeled on both phone and desktop layouts.
  const showAllLabels = true;

  const [layouts, setLayouts] = useState<Partial<Record<Path, ItemLayout>>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const placed = useRef(false);

  const activeItem = navItems.find((item) =>
    isPathActive(pathname, item.to, item.end),
  );
  const activeLayout = activeItem ? layouts[activeItem.to] : undefined;

  useEffect(() => {
    if (!activeLayout) {
      placed.current = false;
      pillOpacity.value = 0;
      return;
    }
    if (!placed.current) {
      // First measurement: jump straight there, no slide.
      pillX.value = activeLayout.x;
      pillWidth.value = activeLayout.width;
      pillOpacity.value = 1;
      placed.current = true;
      return;
    }
    const config = { duration: 250, easing: Easing.bezier(0.23, 1, 0.32, 1) };
    pillX.value = withTiming(activeLayout.x, config);
    pillWidth.value = withTiming(activeLayout.width, config);
  }, [activeLayout?.x, activeLayout?.width]); // eslint-disable-line react-hooks/exhaustive-deps

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    width: pillWidth.value,
    transform: [{ translateX: pillX.value }],
  }));

  const onItemLayout = (to: Path) => (e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setLayouts((prev) =>
      prev[to]?.x === x && prev[to]?.width === w
        ? prev
        : { ...prev, [to]: { x, width: w } },
    );
  };

  return (
    <View className="flex-row justify-center">
      <View
        accessibilityRole="tablist"
        className="w-full rounded-[6px] border-2 border-burgundy bg-card p-1 shadow-stack"
      >
        {/* No padding/border on this row, so measured x values line up with the pill. */}
        <View className="flex-row items-center justify-around gap-1">
          <Animated.View
            className="pointer-events-none absolute bottom-0 left-0 top-0 rounded-[4px] bg-burgundy"
            style={pillStyle}
          />
          {navItems.map(({ to, label, icon: Icon, end }) => {
            const active = isPathActive(pathname, to, end);
            return (
              <Pressable
                key={to}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                onPress={() => router.navigate(to)}
                onLayout={onItemLayout(to)}
                className={`h-12 min-w-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-[4px] px-2.5 ${
                  active ? "" : "active:bg-ink/5"
                }`}
              >
                <Icon color={active ? CARD : INK} size={18} />
                {(active || showAllLabels) && (
                  <Text
                    numberOfLines={1}
                    className={`font-display text-xs font-bold uppercase ${active ? "text-card" : "text-ink"}`}
                  >
                    {label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
