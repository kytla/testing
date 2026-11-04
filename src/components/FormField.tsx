import { Eye, EyeOff } from "lucide-react-native";
import { forwardRef, useState } from "react";
import {
    Pressable,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from "react-native";

// Icons and placeholders can't read Tailwind classes. Use the real hex values from your tailwind config.
const MUTED = "#7A5650"; // text-muted (icon)
const PLACEHOLDER = "#7A5650B3"; // text-muted/70 (b3 = 70% opacity)

interface FormFieldProps extends Omit<
  TextInputProps,
  "className" | "style" | "editable" | "secureTextEntry"
> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  type?: "text" | "email" | "password";
  disabled?: boolean;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(
  function FormField(
    {
      id,
      label,
      error,
      hint,
      type = "text",
      disabled,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) {
    const [revealed, setRevealed] = useState(false);
    const [focused, setFocused] = useState(false);
    const isPassword = type === "password";
    const message = error ?? hint;

    // `type` on the web decided the keyboard and capitalization. On native those are separate props.
    const typeProps: TextInputProps =
      type === "email"
        ? {
            keyboardType: "email-address",
            autoCapitalize: "none",
            autoCorrect: false,
          }
        : isPassword
          ? { autoCapitalize: "none", autoCorrect: false }
          : {};

    const borderClass = error
      ? "border-heart border-b-heart"
      : focused
        ? "border-mahogany border-b-mahogany"
        : "border-line border-b-orchid";

    return (
      <View>
        <Text className="mb-1.5 font-display text-[11px] font-bold uppercase tracking-widest text-ink">
          {label}
        </Text>
        <View className="relative">
          <TextInput
            ref={ref}
            {...typeProps}
            {...rest}
            nativeID={id}
            editable={!disabled}
            secureTextEntry={isPassword && !revealed}
            accessibilityLabel={label}
            accessibilityHint={message}
            placeholderTextColor={PLACEHOLDER}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            className={`h-12 w-full rounded-[6px] border border-b-[3px] bg-card px-3 font-display text-base text-ink ${
              focused ? "bg-card" : "bg-card"
            } ${borderClass} ${isPassword ? "pr-12" : ""} ${disabled ? "opacity-60" : ""}`}
          />
          {isPassword && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={revealed ? "Hide password" : "Show password"}
              accessibilityState={{ selected: revealed }}
              onPress={() => setRevealed((r) => !r)}
              hitSlop={8}
              className="absolute bottom-0 right-1.5 top-0 justify-center"
            >
              <View className="rounded-[6px] p-2 active:bg-wheat">
                {revealed ? (
                  <EyeOff color={MUTED} size={16} />
                ) : (
                  <Eye color={MUTED} size={16} />
                )}
              </View>
            </Pressable>
          )}
        </View>
        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            className="mt-1.5 px-4 font-display text-xs text-heart"
          >
            {error}
          </Text>
        ) : hint ? (
          <Text className="mt-1.5 px-4 font-display text-xs text-muted">
            {hint}
          </Text>
        ) : null}
      </View>
    );
  },
);
