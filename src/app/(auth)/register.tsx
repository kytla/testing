import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { toast } from "sonner-native";
import { AuthLayout } from "../../components/AuthLayout";
import { FormAlert } from "../../components/FormAlert";
import { FormField } from "../../components/FormField";
import { SubmitButton } from "../../components/SubmitButton";
import { useAuth } from "../../contexts/AuthContexts";
import type { FieldErrors } from "../../types/auth";
import { AuthError } from "../../utils/authService";
import {
    PASSWORD_MIN,
    hasErrors,
    validateRegister,
    type RegisterFields,
} from "../../utils/validation";

const initialValues: Record<RegisterFields, string> = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};
const fieldNames: RegisterFields[] = [
  "fullName",
  "email",
  "password",
  "confirmPassword",
];

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<RegisterFields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Replaces document.getElementById(...).focus()
  const inputs = useRef<Partial<Record<RegisterFields, TextInput | null>>>({});

  // TextInput gives us the text directly, not an event.
  const update = (field: RegisterFields) => (text: string) => {
    setValues((v) => ({ ...v, [field]: text }));
    setErrors((er) => ({ ...er, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (submitting) return; // the keyboard's return key can fire this while loading
    const found = validateRegister(values);
    setErrors(found);
    if (hasErrors(found)) {
      const first = fieldNames.find((f) => found[f]);
      if (first) inputs.current[first]?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const email = values.email.trim();
      await register({
        fullName: values.fullName.trim(),
        email,
        password: values.password,
      });
      toast.success("Account created");
      // `state` became a route param. Params are strings, which is fine for an email.
      router.replace({
        pathname: "/(auth)/login",
        params: { registeredEmail: email },
      });
    } catch (err) {
      if (
        err instanceof AuthError &&
        err.field &&
        fieldNames.includes(err.field as RegisterFields)
      ) {
        setErrors({ [err.field]: err.message });
      } else {
        setFormError(
          err instanceof AuthError
            ? err.message
            : "We couldn’t create your account. Please try again.",
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join the campus conversation. You’ll always post anonymously."
      footer={
        <>
          Already have an account?{" "}
          <Text
            accessibilityRole="link"
            onPress={() => router.replace("/(auth)/login")}
            className="font-semibold text-ink underline"
          >
            Log In
          </Text>
        </>
      }
    >
      <View className="gap-4">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <FormField
          ref={(el) => {
            inputs.current.fullName = el;
          }}
          id="register-fullName"
          label="Full name"
          autoComplete="name"
          placeholder="Juan Dela Cruz"
          value={values.fullName}
          onChangeText={update("fullName")}
          error={errors.fullName}
          hint="Private — never shown on your posts."
          disabled={submitting}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => inputs.current.email?.focus()}
        />
        <FormField
          ref={(el) => {
            inputs.current.email = el;
          }}
          id="register-email"
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
        <FormField
          ref={(el) => {
            inputs.current.password = el;
          }}
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={values.password}
          onChangeText={update("password")}
          error={errors.password}
          hint={`At least ${PASSWORD_MIN} characters.`}
          disabled={submitting}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => inputs.current.confirmPassword?.focus()}
        />
        <FormField
          ref={(el) => {
            inputs.current.confirmPassword = el;
          }}
          id="register-confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          value={values.confirmPassword}
          onChangeText={update("confirmPassword")}
          error={errors.confirmPassword}
          disabled={submitting}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <View className="pt-1">
          <SubmitButton
            loading={submitting}
            loadingLabel="Creating account…"
            onPress={handleSubmit}
          >
            Create Account
          </SubmitButton>
        </View>
      </View>
    </AuthLayout>
  );
}
