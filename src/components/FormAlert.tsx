import { CircleAlert, CircleCheck } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

// Icons can't read Tailwind classes. Use the real `heart` and `ink` hex values from your tailwind config.
const HEART = "#CA4333"; // text-heart
const INK = "#700D0A"; // text-ink

interface FormAlertProps {
  tone: "error" | "success";
  children: React.ReactNode;
}

export function FormAlert({ tone, children }: FormAlertProps) {
  const isError = tone === "error";
  const Icon = isError ? CircleAlert : CircleCheck;
  return (
    <View
      accessibilityRole={isError ? "alert" : undefined}
      accessibilityLiveRegion={isError ? "assertive" : "polite"}
      className={`flex-row items-start gap-2.5 rounded-[4px] border-[1.5px] px-3.5 py-3 ${
        isError ? "border-burgundy border-dashed bg-[#F5D5CF]" : "border-burgundy bg-wheat"
      }`}
    >
      <View className="mt-0.5 shrink-0">
        <Icon color={isError ? HEART : INK} size={16} />
      </View>
      <Text className="flex-1 font-display text-sm leading-snug text-ink">
        {children}
      </Text>
    </View>
  );
}
