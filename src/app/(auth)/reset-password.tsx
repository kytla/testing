// reset-password.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { AuthLayout } from "../../components/AuthLayout";
import { FormAlert } from "../../components/FormAlert";
import { FormField } from "../../components/FormField";
import { SubmitButton } from "../../components/SubmitButton";
import { useAuth } from "../../contexts/AuthContexts";
import { AuthError } from "../../utils/authService";
// Import your existing validators!
import { validatePassword } from "../../utils/validation"; 

export default function ResetPassword() {
  const router = useRouter();
  const { ctuEmail, fullName, username } = useLocalSearchParams<{ 
    ctuEmail: string; 
    fullName: string; 
    username: string 
  }>();

  const { resetPassword } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    if (submitting) return;

    // Use your existing validation logic
    const passwordError = validatePassword(password);
    const confirmError = password !== confirmPassword ? "Passwords don’t match." : undefined;

    setError({ password: passwordError, confirm: confirmError });

    if (passwordError || confirmError) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await resetPassword(ctuEmail, password);
      // Navigate back to login upon success
      router.replace("/(auth)/login");
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle={`Setting password for ${fullName} (@${username})`}
      backTo="/(auth)/login"
    >
      <View className="gap-4">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <FormField
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={password}
          onChangeText={(t) => { setPassword(t); setError({ ...error, password: undefined }); }}
          error={error.password}
          disabled={submitting}
        />

        <FormField
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setError({ ...error, confirm: undefined }); }}
          error={error.confirm}
          disabled={submitting}
          returnKeyType="send"
          onSubmitEditing={handleReset}
        />

        <SubmitButton loading={submitting} loadingLabel="Resetting…" onPress={handleReset}>
          Reset Password
        </SubmitButton>
      </View>
    </AuthLayout>
  );
}