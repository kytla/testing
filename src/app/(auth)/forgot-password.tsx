// forgot-password.tsx

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

const linkClass = "font-semibold text-ink underline";

export default function ForgotPassword() {
  // We need two new functions from AuthContext: requestPasswordReset and verifyResetOTP
  const { requestPasswordReset, verifyResetOTP } = useAuth();
  const router = useRouter();

  // Form states
  const [ctuEmail, setCtuEmail] = useState("");
  const [gmailEmail, setGmailEmail] = useState("");
  const [otp, setOtp] = useState("");

  // UI states
  const [step, setStep] = useState<"request" | "verify">("request");
  const [error, setError] = useState<{ ctu?: string; gmail?: string; otp?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Refs for focusing
  const ctuEmailRef = useRef<TextInput | null>(null);
  const gmailEmailRef = useRef<TextInput | null>(null);
  const otpRef = useRef<TextInput | null>(null);

  const handleRequestOTP = async () => {
    if (submitting) return;

    // 1. Validate format
    let ctuError = validateEmail(ctuEmail);
    let gmailError = validateEmail(gmailEmail);

    // 2. Enforce the specific domains
    if (!ctuError && !ctuEmail.trim().toLowerCase().endsWith("@ctu.edu.ph")) {
      ctuError = "Must be a @ctu.edu.ph email.";
    }
    if (!gmailError && !gmailEmail.trim().toLowerCase().endsWith("@gmail.com")) {
      gmailError = "Must be a @gmail.com email.";
    }

    setError({ ctu: ctuError, gmail: gmailError });

    if (ctuError) {
      ctuEmailRef.current?.focus();
      return;
    }
    if (gmailError) {
      gmailEmailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      // Send both emails to the backend
      await requestPasswordReset(ctuEmail.trim(), gmailEmail.trim());
      setStep("verify"); // Move to OTP input screen
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (submitting) return;

    // Validate OTP length (assuming 6 digits)
    if (!otp || otp.length < 6) {
      setError({ otp: "Please enter the 6-digit code." });
      otpRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      // Verify OTP and get user data back from the backend
      const userData = await verifyResetOTP(ctuEmail.trim(), otp.trim());
      
      // Navigate to the new reset-password screen with data
      router.push({
        pathname: "/(auth)/reset-password",
        params: { 
          ctuEmail: ctuEmail.trim(), 
          fullName: userData.full_name, 
          username: userData.username 
        }
      });
    } catch (err) {
      setFormError(
        err instanceof AuthError
          ? err.message
          : "Invalid or expired OTP. Please try again."
      );
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
            onSubmitEditing={handleRequestOTP}
          />

          <SubmitButton
            loading={submitting}
            loadingLabel="Sending OTP…"
            onPress={handleRequestOTP}
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
            returnKeyType="send"
            onSubmitEditing={handleVerifyOTP}
            maxLength={6}
            keyboardType="number-pad"
          />

          <SubmitButton
            loading={submitting}
            loadingLabel="Verifying…"
            onPress={handleVerifyOTP}
          >
            Verify Code
          </SubmitButton>

          <Pressable
            onPress={() => {
              setStep("request");
              setOtp("");
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