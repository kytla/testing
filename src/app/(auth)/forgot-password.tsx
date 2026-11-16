import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { toast } from "sonner-native"; 
import { AuthLayout } from "../../components/AuthLayout";
import { FormAlert } from "../../components/FormAlert";
import { FormField } from "../../components/FormField";
import { SubmitButton } from "../../components/SubmitButton";
import { useAuth } from "../../contexts/AuthContexts";
import { AuthError } from "../../utils/authService";
import { validateEmail, validatePassword } from "../../utils/validation";

const linkClass = "font-semibold text-ink underline";

export default function ForgotPassword() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const router = useRouter();

  const [ctuEmail, setCtuEmail] = useState("");
  const [gmailEmail, setGmailEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState<"request" | "verify">("request");
  const [error, setError] = useState<{ ctu?: string; gmail?: string; otp?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ctuEmailRef = useRef<TextInput | null>(null);
  const gmailEmailRef = useRef<TextInput | null>(null);
  const otpRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const confirmRef = useRef<TextInput | null>(null);

  const handleSendOTP = async () => {
    if (submitting) return;

    let ctuError = validateEmail(ctuEmail);
    let gmailError = validateEmail(gmailEmail);

    if (!ctuError && !ctuEmail.trim().toLowerCase().endsWith("@ctu.edu.ph")) {
      ctuError = "Must be a @ctu.edu.ph email.";
    }
    if (!gmailError && !gmailEmail.trim().toLowerCase().endsWith("@gmail.com")) {
      gmailError = "Must be a @gmail.com email.";
    }

    setError({ ctu: ctuError, gmail: gmailError });

    if (ctuError) return ctuEmailRef.current?.focus();
    if (gmailError) return gmailEmailRef.current?.focus();

    setSubmitting(true);
    setFormError(null);

    try {
      await requestPasswordReset(ctuEmail.trim(), gmailEmail.trim()); 
      toast.success(`OTP sent to ${gmailEmail}!`);
      setStep("verify"); 
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (submitting) return;

    let otpError = !otp || otp.length < 6 ? "Please enter the 6-digit code." : undefined;
    let passwordError = validatePassword(newPassword);
    let confirmError = newPassword !== confirmPassword ? "Passwords don’t match." : undefined;

    setError({ otp: otpError, password: passwordError, confirm: confirmError });

    if (otpError) return otpRef.current?.focus();
    if (passwordError) return passwordRef.current?.focus();
    if (confirmError) return confirmRef.current?.focus();

    setSubmitting(true);
    setFormError(null);

    try {
      await resetPassword(ctuEmail.trim(), otp.trim(), newPassword);
      toast.success("Password updated successfully! Please log in.");
      router.replace("/(auth)/login");
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : "Invalid or expired OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={step === "request" ? "Reset password" : "Enter OTP"}
      subtitle={
        step === "request"
          ? "Enter your CTU email and the Gmail where we'll send the OTP."
          : `We sent a 6-digit code to ${gmailEmail}. It expires in 5 minutes.`
      }
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
      {step === "request" ? (
        <View className="gap-4">
          {formError && <FormAlert tone="error">{formError}</FormAlert>}

          <FormField
            ref={ctuEmailRef}
            id="forgot-ctu-email"
            label="CTU Email"
            type="email"
            autoComplete="email"
            placeholder="name@ctu.edu.ph"
            value={ctuEmail}
            onChangeText={(text) => {
              setCtuEmail(text);
              setError({ ...error, ctu: undefined });
            }}
            error={error.ctu}
            disabled={submitting}
            returnKeyType="next"
            onSubmitEditing={() => gmailEmailRef.current?.focus()}
          />

          <FormField
            ref={gmailEmailRef}
            id="forgot-gmail-email"
            label="Recovery Gmail"
            type="email"
            autoComplete="email"
            placeholder="name@gmail.com"
            value={gmailEmail}
            onChangeText={(text) => {
              setGmailEmail(text);
              setError({ ...error, gmail: undefined });
            }}
            error={error.gmail}
            disabled={submitting}
            returnKeyType="send"
            onSubmitEditing={handleSendOTP}
          />

          <SubmitButton
            loading={submitting}
            loadingLabel="Sending Code…"
            onPress={handleSendOTP}
          >
            Send OTP
          </SubmitButton>
        </View>
      ) : (
        <View className="gap-4">
          {formError && <FormAlert tone="error">{formError}</FormAlert>}

          <FormField
            ref={otpRef}
            id="forgot-otp"
            label="6-Digit OTP"
            type="text"
            placeholder="000000"
            value={otp}
            onChangeText={(text) => {
              setOtp(text);
              setError({ ...error, otp: undefined });
            }}
            error={error.otp}
            disabled={submitting}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            maxLength={6}
            keyboardType="number-pad"
          />

          <FormField
            ref={passwordRef}
            id="forgot-new-password"
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setError({ ...error, password: undefined });
            }}
            error={error.password}
            disabled={submitting}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />

          <FormField
            ref={confirmRef}
            id="forgot-confirm-password"
            label="Confirm Password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError({ ...error, confirm: undefined });
            }}
            error={error.confirm}
            disabled={submitting}
            returnKeyType="send"
            onSubmitEditing={handleResetPassword}
          />

          <SubmitButton
            loading={submitting}
            loadingLabel="Resetting…"
            onPress={handleResetPassword}
          >
            Change Password
          </SubmitButton>

          <Pressable
            onPress={() => {
              setStep("request");
              setOtp("");
              setNewPassword("");
              setConfirmPassword("");
              setError({});
            }}
            className="mt-2 items-center"
          >
            <Text className="text-sm font-semibold text-ink/60 underline">
              Didn't get a code? Try again.
            </Text>
          </Pressable>
        </View>
      )}
    </AuthLayout>
  );
}