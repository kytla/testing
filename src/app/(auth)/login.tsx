//Login.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { toast } from "sonner-native";
import { AuthLayout } from "../../components/AuthLayout";
import { FormAlert } from "../../components/FormAlert";
import { FormField } from "../../components/FormField";
import { SubmitButton } from "../../components/SubmitButton";
import { useAuth } from "../../contexts/AuthContexts";
import type { FieldErrors } from "../../types/auth";
import { AuthError } from "../../utils/authService";
import {
    hasErrors,
    validateLogin,
    type LoginFields,
} from "../../utils/validation";

const fieldNames: LoginFields[] = ["email", "password"];

// `underline-offset`, `decoration-*`, `hover:` and `focus-visible:` don't exist on native.
const linkClass = "font-semibold text-ink underline";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  // `location.state` became a route param. Params can be string | string[], so normalize.
  const params = useLocalSearchParams<{
    registeredEmail?: string | string[];
  }>();
  const registeredEmail = Array.isArray(params.registeredEmail)
    ? params.registeredEmail[0]
    : params.registeredEmail;

  const [values, setValues] = useState<Record<LoginFields, string>>({
    email: registeredEmail ?? "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors<LoginFields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Replaces document.getElementById(...).focus()
  const inputs = useRef<Partial<Record<LoginFields, TextInput | null>>>({});

  // TextInput gives us the text directly, not an event.
  const update = (field: LoginFields) => (text: string) => {
    setValues((v) => ({ ...v, [field]: text }));
    setErrors((er) => ({ ...er, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (submitting) return; // the keyboard's return key can fire this while loading
    const found = validateLogin(values);
    setErrors(found);
    if (hasErrors(found)) {
      const first = fieldNames.find((f) => found[f]);
      if (first) inputs.current[first]?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await login(values.email.trim(), values.password);
      toast.success("Welcome back!");
      router.replace("/(tabs)");
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setValues((v) => ({ ...v, password: "" }));
      setSubmitting(false);
    }
  };


  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          Don’t have an account?{" "}
          <Text
            accessibilityRole="link"
            onPress={() => router.replace("/(auth)/register")}
            className={linkClass}
          >
            Register
          </Text>
        </>
      }
    >
      <View className="gap-4">
        {formError ? (
          <FormAlert tone="error">{formError}</FormAlert>
        ) : registeredEmail ? (
          <FormAlert tone="success">
            Account created! Log in to start confessing.
          </FormAlert>
        ) : null}

        <FormField
          ref={(el) => {
            inputs.current.email = el;
          }}
          id="login-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="name@ctu.edu.ph"
          value={values.email}
          onChangeText={update("email")}
          error={errors.email}
          disabled={submitting}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => inputs.current.password?.focus()}
        />

        <View>
          <FormField
            ref={(el) => {
              inputs.current.password = el;
            }}
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={values.password}
            onChangeText={update("password")}
            error={errors.password}
            disabled={submitting}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
          <View className="mt-2 flex-row justify-end px-1">
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/(auth)/forgot-password")}
              hitSlop={8}
            >
              <Text className={`text-xs ${linkClass}`}>Forgot Password?</Text>
            </Pressable>
          </View>
        </View>

        <SubmitButton
          loading={submitting}
          loadingLabel="Logging in…"
          onPress={handleSubmit}
        >
          Log In
        </SubmitButton>
      </View>
    </AuthLayout>
  );
}
