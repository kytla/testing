import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AuthLayout } from "../../components/AuthLayout";
import { FormAlert } from "../../components/FormAlert";
import { FormField } from "../../components/FormField";
import { SubmitButton } from "../../components/SubmitButton";
import { useAuth } from "../../contexts/AuthContexts";
import { AuthError } from "../../utils/authService";
import { validateEmail } from "../../utils/validation";

// `underline-offset`, `decoration-*`, `hover:` and `focus-visible:` don't exist on native.
const linkClass = "font-semibold text-ink underline";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Replaces document.getElementById('forgot-email').focus()
  const emailRef = useRef<TextInput | null>(null);

  const handleSubmit = async () => {
    if (submitting) return; // the keyboard's return key can fire this while loading
    const found = validateEmail(email);
    setError(found);
    if (found) {
      emailRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter the email you signed up with and we’ll send you a reset link."
      backTo="/(auth)/login"
      footer={
        <>
          Remembered it?{" "}
          <Text
            accessibilityRole="link"
            onPress={() => router.navigate("/(auth)/login")}
            className={linkClass}
          >
            Log In
          </Text>
        </>
      }
    >
      {sentTo ? (
        <View className="gap-4">
          <FormAlert tone="success">
            If an account exists for{" "}
            <Text className="font-semibold">{sentTo}</Text>, a reset link is on
            its way. Check your inbox and spam folder.
          </FormAlert>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSentTo(null)}
            className="h-12 w-full items-center justify-center rounded-[6px] border border-ink active:bg-ink/5"
          >
            <Text className="font-display text-sm font-semibold text-ink">
              Use a different email
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-4">
          {formError && <FormAlert tone="error">{formError}</FormAlert>}
          <FormField
            ref={emailRef}
            id="forgot-email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="name@ctu.edu.ph"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(undefined);
            }}
            error={error}
            disabled={submitting}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          <SubmitButton
            loading={submitting}
            loadingLabel="Sending link…"
            onPress={handleSubmit}
          >
            Send reset link
          </SubmitButton>
        </View>
      )}
    </AuthLayout>
  );
}
