import { useRouter, type Href } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons can't read Tailwind classes. Use the real `ink` hex from your tailwind config.
const INK = "#700D0A";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  backTo?: Href;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  backTo = "/(auth)/welcome",
  footer,
  children,
}: AuthLayoutProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1, // replaces min-h-full
          paddingTop: insets.top + 20, // pt-5 plus the notch/status bar
          paddingBottom: Math.max(insets.bottom, 24), // max(safe-area-inset-bottom, 24px)
          paddingHorizontal: 20,
        }}
      >
        <View className="w-full max-w-md flex-1 self-center">
          <View className="relative items-center justify-center pb-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.navigate(backTo)}
              className="absolute left-0 -ml-2 rounded-[6px] p-2"
            >
              <ArrowLeft color={INK} size={20} />
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.navigate("/(auth)/welcome")}
            >
              <Text className="font-display text-lg font-extrabold tracking-tight text-burgundy">
                CTU Confessions
              </Text>
            </Pressable>
          </View>

          <View className="flex-1 justify-center py-8">
            <Text
              accessibilityRole="header"
              className="font-display text-[30px] font-extrabold tracking-tight text-burgundy"
            >
              {title}
            </Text>
            {subtitle && (
              <Text className="mt-2 font-display text-sm leading-relaxed text-muted">
                {subtitle}
              </Text>
            )}
            <View className="mt-6">
              {children}
            </View>
            {footer && (
              <Text className="mt-6 text-center font-display text-sm text-muted">
                {footer}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
