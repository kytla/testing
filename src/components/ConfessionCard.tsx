import { CalendarDays, Flag, Tag } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { categoryStyles } from "../data/categoryStyles";
import type { Confession } from "../types/confession";

// Icons can't read Tailwind classes. Use the real `muted` hex from your tailwind config.
const MUTED = "#7A5650";

interface ConfessionCardProps {
  confession: Confession;
  onReport?: () => void;
}

export function ConfessionCard({ confession, onReport }: ConfessionCardProps) {
  return (
    <View className="h-full w-full rounded-[4px] border-[1.5px] border-ink bg-card p-6 shadow-stack sm:p-10">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-center gap-2">
            <View className="rotate-[-2deg] rounded-[3px] border-2 border-mahogany px-2 py-0.5">
              <Text className="font-mono text-sm font-semibold text-mahogany">
                #{confession.number}
              </Text>
            </View>
            <Text className="font-display text-sm font-bold text-burgundy sm:text-base">
              Anonymous
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <CalendarDays color={MUTED} size={16} />
            <Text className="font-display text-sm text-muted sm:text-base">
              {confession.date}
            </Text>
          </View>
        </View>

        {confession.mine ? (
          <View className="shrink-0 rounded-[4px] border border-line px-2 py-1">
            <Text className="font-display text-xs text-muted">Your post</Text>
          </View>
        ) : (
          onReport && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Report this confession"
              onPress={onReport}
              hitSlop={8}
              className="-mr-2 -mt-2 shrink-0 rounded-[6px] p-2 active:bg-ink/5"
            >
              <Flag color={MUTED} size={16} />
            </Pressable>
          )
        )}
      </View>

      <View className="flex-1 justify-center py-8">
        <Text
          className={`font-serif font-medium leading-snug tracking-tight text-ink ${textSize(confession.text)}`}
        >
          <Text className="text-muted">“</Text>
          {confession.text}
          <Text className="text-muted">”</Text>
        </Text>
      </View>

      <View className="flex-row items-center gap-3">
        <Tag color={MUTED} size={16} />
        <View
          className={`rounded-[4px] px-2.5 py-1 ${categoryStyles[confession.category]}`}
        >
          <Text className="font-display text-xs font-bold uppercase tracking-wider text-ink">
            {confession.category}
          </Text>
        </View>
      </View>
    </View>
  );
}

function textSize(text: string): string {
  if (text.length < 70) return "text-3xl sm:text-4xl";
  if (text.length < 120) return "text-2xl sm:text-3xl";
  if (text.length < 220) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}
