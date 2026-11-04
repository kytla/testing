import { useRouter } from "expo-router";
import { Heart, MessageCircle, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useConfessions } from "../../contexts/ConfessionContext";
import { categories } from "../../data/categories";
import { categoryStyles } from "../../data/categoryStyles";
import type { Confession, ConfessionCategory } from "../../types/confession";

// Icons and placeholders can't read Tailwind classes. Use the real `muted` hex from your tailwind config.
const MUTED = "#7A5650";

type SortMode = "trending" | "newest";

export default function Explore() {
  const { feed, getComments, getReaction, setCurrentId } = useConfessions();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState<ConfessionCategory | "All">("All");
  const [sort, setSort] = useState<SortMode>("trending");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = feed.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q ||
          p.text.toLowerCase().includes(q) ||
          String(p.number).includes(q)),
    );
    return [...filtered].sort((a, b) =>
      sort === "newest"
        ? b.number - a.number
        : b.hearts +
          b.laughs +
          getComments(b).length * 3 -
          (a.hearts + a.laughs + getComments(a).length * 3),
    );
  }, [feed, query, category, sort, getComments]);

  const open = (id: string) => {
    setCurrentId(id);
    router.navigate("/");
  };

  // Passed as an element (not a component function), so the TextInput keeps focus while you type.
  const header = (
    <View className="pb-6">
      <Text
        accessibilityRole="header"
        className="font-display text-[30px] font-extrabold tracking-tight text-burgundy"
      >
        Explore
      </Text>

      <View className="relative mt-5">
        <View className="pointer-events-none absolute bottom-0 left-4 top-0 z-10 justify-center">
          <Search color={MUTED} size={16} />
        </View>
        <TextInput
          accessibilityLabel="Search confessions"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search confessions or #number"
          placeholderTextColor={MUTED}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
          className={`w-full rounded-[6px] border border-b-[3px] border-orchid bg-card py-3 pl-11 pr-4 font-display text-sm text-ink ${
            searchFocused ? "border-ink" : "border-line"
          }`}
        />
      </View>

      <View className="mt-4 flex-row flex-wrap items-center justify-between gap-3">
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Category"
          className="flex-row flex-wrap gap-1.5"
        >
          {(["All", ...categories] as const).map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setCategory(c)}
                className={`rounded-[5px] border px-3 py-2 ${
                  active
                    ? "border-burgundy bg-mahogany"
                    : "border-line bg-card active:border-ink"
                }`}
              >
                <Text
                  className={`font-display text-xs font-medium ${active ? "text-card" : "text-ink"}`}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Sort"
          className="flex-row rounded-[6px] border border-burgundy bg-card p-1"
        >
          {(["trending", "newest"] as const).map((s) => {
            const active = sort === s;
            return (
              <Pressable
                key={s}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setSort(s)}
                className={`rounded-[4px] px-3 py-1.5 ${active ? "bg-paper" : ""}`}
              >
                <Text
                  className={`font-display text-xs font-medium capitalize ${active ? "text-ink" : "text-muted"}`}
                >
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderItem = ({
    item: p,
    index,
  }: {
    item: Confession;
    index: number;
  }) => {
    const hearts = p.hearts + (getReaction(p.id).heart ? 1 : 0);
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => open(p.id)}
        className={`mb-4 rounded-[4px] border-[1.5px] border-burgundy bg-card px-4 py-4 shadow-stack active:opacity-70`}
      >
        <View className="mb-2 flex-row flex-wrap items-center gap-2">
          <Text className="font-mono text-xs font-medium text-mahogany">
            #{p.number}
          </Text>
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no"
            className="font-display text-xs text-muted"
          >
            ·
          </Text>
          <Text className="font-display text-xs text-muted">{p.date}</Text>
          <View
            className={`ml-1 rounded-[4px] px-2 py-0.5 ${categoryStyles[p.category]}`}
          >
            <Text className="font-mono text-xs font-medium text-mahogany">
              {p.category}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={2}
          className="font-serif text-base leading-relaxed text-ink sm:text-lg"
        >
          “{p.text}”
        </Text>

        <View className="mt-2 flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <Heart color={MUTED} size={14} />
            <Text className="font-display text-xs text-muted">{hearts}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <MessageCircle color={MUTED} size={14} />
            <Text className="font-display text-xs text-muted">
              {getComments(p).length}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      className="flex-1"
      data={results}
      keyExtractor={(p) => p.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View className="mt-10 items-center">
          <Text className="text-center font-display font-semibold text-ink">
            No confessions found
          </Text>
          <Text className="mt-1 text-center font-display text-sm text-muted">
            Try a different word or category.
          </Text>
        </View>
      }
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      // mx-auto w-full max-w-3xl px-5 pb-12 pt-4
      contentContainerStyle={{
        width: "100%",
        maxWidth: 768,
        alignSelf: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 48,
      }}
    />
  );
}
