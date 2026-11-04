import { format } from "date-fns";
import { useRouter } from "expo-router";
import { Loader2, Lock, LogOut, Pencil } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { toast } from "sonner-native";
import { useAuth } from "../contexts/AuthContexts";
import type { FieldErrors } from "../types/auth";
import { AuthError } from "../utils/authService";
import {
    hasErrors,
    validateProfile,
    type ProfileFields,
} from "../utils/validation";
import { FormAlert } from "./FormAlert";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

// Icons can't read Tailwind classes, so they need real hex colors.
// Replace with the `ink` and `muted` values from your tailwind config.
const INK = "#700D0A";
const MUTED = "#7A5650";

const ghostButton =
  "flex-row items-center gap-1.5 rounded-[6px] border border-burgundy px-3 py-2 disabled:opacity-60";
const ghostText = "text-xs font-medium text-ink";

// Replaces `animate-spin`, which is a web-only CSS animation.
function Spinner({ color, size }: { color: string; size: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Loader2 color={color} size={size} />
    </Animated.View>
  );
}

export function AccountPanel() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<ProfileFields, string>>({
    fullName: "",
    email: "",
    username: "",
  });
  const [errors, setErrors] = useState<FieldErrors<ProfileFields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const startEditing = () => {
    setValues({
      fullName: user.fullName,
      email: user.email,
      username: user.username,
    });
    setErrors({});
    setFormError(null);
    setEditing(true);
  };

  // TextInput gives us the text directly, not an event.
  const update = (field: ProfileFields) => (text: string) => {
    setValues((v) => ({ ...v, [field]: text }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSave = async () => {
    const found = validateProfile(values);
    setErrors(found);
    if (hasErrors(found)) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateProfile({
        fullName: values.fullName,
        email: values.email,
        username: values.username,
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      if (err instanceof AuthError && err.field)
        setErrors({ [err.field]: err.message });
      else
        setFormError(
          err instanceof AuthError
            ? err.message
            : "Couldn’t save changes. Please try again.",
        );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    toast("You’ve been logged out");
    router.replace("/(auth)/welcome");
  };

  return (
    <View className="rounded-[6px] border-2 border-dashed border-burgundy bg-card p-5 shadow-stack sm:p-6">
      <View className="flex-row items-center gap-1.5">
        <Lock color={MUTED} size={14} />
        <Text className="text-xs text-muted">
          Private — only you can see this
        </Text>
      </View>

      {editing ? (
        <View className="mt-4 gap-4">
          <Text
            accessibilityRole="header"
            className="text-lg font-extrabold tracking-tight text-burgundy"
          >
            Edit account
          </Text>
          {formError && <FormAlert tone="error">{formError}</FormAlert>}
          <FormField
            id="profile-fullName"
            label="Full name"
            autoComplete="name"
            value={values.fullName}
            onChangeText={update("fullName")}
            error={errors.fullName}
            disabled={saving}
          />
          <FormField
            id="profile-username"
            label="Username"
            autoComplete="username"
            autoCapitalize="none"
            value={values.username}
            onChangeText={update("username")}
            error={errors.username}
            hint="Private handle. Your posts still show as Anonymous."
            disabled={saving}
          />
          <FormField
            id="profile-email"
            label="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={values.email}
            onChangeText={update("email")}
            error={errors.email}
            disabled={saving}
          />
          <View className="flex-row gap-3 pt-1">
            <Pressable
              accessibilityRole="button"
              onPress={() => setEditing(false)}
              disabled={saving}
              className="h-12 flex-1 items-center justify-center rounded-[6px] border border-line disabled:opacity-60"
            >
              <Text className="text-sm font-semibold text-ink">Cancel</Text>
            </Pressable>
            <View className="flex-1">
              <SubmitButton
                loading={saving}
                loadingLabel="Saving…"
                onPress={handleSave}
              >
                Save
              </SubmitButton>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View className="mt-3 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-[4px] bg-burgundy">
              <Text className="font-display text-lg font-extrabold text-wheat">
                {user.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                className="font-display text-xl font-extrabold tracking-tight text-burgundy"
              >
                {user.fullName}
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-sm text-muted">
                @{user.username}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={startEditing}
              className={ghostButton}
            >
              <Pencil color={INK} size={14} />
              <Text className={ghostText}>Edit</Text>
            </Pressable>
          </View>

          <View className="mt-5 gap-4 border-t border-dashed border-line pt-4 sm:flex-row">
            <View className="min-w-0 sm:flex-1">
              <Text className="text-xs text-muted">Email</Text>
              <Text className="mt-0.5 text-sm text-ink">{user.email}</Text>
            </View>
            <View className="sm:flex-1">
              <Text className="text-xs text-muted">Member since</Text>
              <Text className="mt-0.5 text-sm text-ink">
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-4">
            <Text className="text-xs text-muted">
              Your posts appear as “Anonymous #…” — never your name.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: loggingOut, disabled: loggingOut }}
              onPress={handleLogout}
              disabled={loggingOut}
              className={ghostButton}
            >
              {loggingOut ? (
                <Spinner color={INK} size={14} />
              ) : (
                <LogOut color={INK} size={14} />
              )}
              <Text className={ghostText}>
                {loggingOut ? "Logging out…" : "Log out"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
