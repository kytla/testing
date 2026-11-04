import { useRouter } from "expo-router";
import {
    Frown,
    Heart,
    Laugh,
    MessageCircle,
    Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";
import { AccountPanel } from "../../components/AccountPanel";
import { useConfessions } from "../../contexts/ConfessionContext";
import { categoryStyles } from "../../data/categoryStyles";

// Icons can't read Tailwind classes. Use the real `muted` hex from your tailwind config.
const MUTED = "#7A5650";

export default function Profile() {
  const { posts, getComments, getReaction, setCurrentId, deletePost } =
    useConfessions();
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mine = posts.filter((p) => p.mine);
  const totalHearts = mine.reduce(
    (sum, p) => sum + p.hearts + (getReaction(p.id).heart ? 1 : 0),
    0,
  );
  const totalComments = mine.reduce((sum, p) => sum + getComments(p).length, 0);

  const view = (id: string) => {
    setCurrentId(id);
    router.navigate("/");
  };

  const confirmDelete = async (id: string, number: number) => {
    setDeletingId(id);
    try {
      await deletePost(id);
      toast(`Deleted Anonymous #${number}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn’t delete this post.",
      );
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets // iOS: keeps the edit form above the keyboard
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
    >
      <Text
        accessibilityRole="header"
        className="font-display text-2xl font-extrabold tracking-tight text-burgundy"
      >
        Profile
      </Text>

      <View className="mt-5">
        <AccountPanel />
      </View>

      <Text
        accessibilityRole="header"
        className="mt-10 font-display text-xl font-extrabold tracking-tight text-burgundy"
      >
        Your confessions
      </Text>
      <View className="mt-4 flex-row border-y-2 border-burgundy">
        <View className="flex-1 py-3">
          <Text className="font-display text-2xl font-extrabold text-burgundy">{mine.length}</Text>
          <Text className="font-display text-xs text-muted">Confessions</Text>
        </View>
        <View className="flex-1 border-l border-line py-3 pl-3">
          <Text className="font-display text-2xl font-extrabold text-burgundy">{totalHearts}</Text>
          <Text className="font-display text-xs text-muted">Hearts</Text>
        </View>
        <View className="flex-1 border-l border-line py-3 pl-3">
          <Text className="font-display text-2xl font-extrabold text-burgundy">{totalComments}</Text>
          <Text className="font-display text-xs text-muted">Comments</Text>
        </View>
      </View>
      <Text className="mt-1 font-display text-xs text-muted">
        Only you can see this list. Everyone else just sees “Anonymous.”
      </Text>

      {mine.length === 0 ? (
        <View className="mt-16 items-center">
          <Text className="text-center font-display font-semibold text-ink">
            You haven’t confessed yet.
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.navigate("/post")}
            className="mt-5 rounded-[6px] bg-ink px-5 py-2.5 active:opacity-90"
          >
            <Text className="font-display text-sm font-semibold text-card">
              Write your first confession
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-6 border-t border-dashed border-line">
          {mine.map((p) => {
            const reaction = getReaction(p.id);
            const confirming = confirmingId === p.id;
            const deleting = deletingId === p.id;
            return (
              <View
                key={p.id}
                className="mb-4 rounded-[4px] border-[1.5px] border-burgundy bg-card p-4 shadow-stack"
              >
                <View className="mb-2 flex-row flex-wrap items-center gap-2">
                  <Text className="font-display text-xs font-medium text-ink">
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
                    className={`ml-1 rounded-[4px] px-2 py-1 ${categoryStyles[p.category]}`}
                  >
                    <Text className="font-display text-xs font-medium text-ink">
                      {p.category}
                    </Text>
                  </View>
                </View>
                <Text className="font-serif text-base leading-relaxed text-ink sm:text-lg">
                  “{p.text}”
                </Text>

                <View className="mt-3 flex-row flex-wrap items-center justify-between gap-3">
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1.5">
                      <Heart color={MUTED} size={14} />
                      <Text className="font-display text-xs text-muted">
                        {p.hearts + (reaction.heart ? 1 : 0)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <Laugh color={MUTED} size={14} />
                      <Text className="font-display text-xs text-muted">
                        {p.laughs + (reaction.laugh ? 1 : 0)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <Frown color={MUTED} size={14} />
                      <Text className="font-display text-xs text-muted">
                        {p.sads + (reaction.sad ? 1 : 0)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <MessageCircle color={MUTED} size={14} />
                      <Text className="font-display text-xs text-muted">
                        {getComments(p).length}
                      </Text>
                    </View>
                  </View>

                  {confirming ? (
                    <View className="flex-row items-center gap-2">
                      <Text className="font-display text-xs text-muted">
                        Delete this post?
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setConfirmingId(null)}
                        disabled={deleting}
                        hitSlop={6}
                        className="rounded-[6px] px-3 py-1.5 active:bg-ink/5"
                      >
                        <Text className="font-display text-xs font-medium text-ink">
                          Cancel
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{
                          busy: deleting,
                          disabled: deleting,
                        }}
                        onPress={() => confirmDelete(p.id, p.number)}
                        disabled={deleting}
                        hitSlop={6}
                        className={`rounded-[6px] bg-heart px-3 py-1.5 ${deleting ? "opacity-70" : ""}`}
                      >
                        <Text className="font-display text-xs font-semibold text-card">
                          {deleting ? "Deleting…" : "Delete"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1">
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => view(p.id)}
                        hitSlop={6}
                        className="rounded-[6px] px-3 py-1.5 active:bg-ink/5"
                      >
                        <Text className="font-display text-xs font-medium text-ink">
                          View card
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete Anonymous #${p.number}`}
                        onPress={() => setConfirmingId(p.id)}
                        hitSlop={6}
                        className="rounded-[6px] p-2 active:bg-ink/5"
                      >
                        <Trash2 color={MUTED} size={16} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
