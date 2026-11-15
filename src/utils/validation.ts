import type { FieldErrors } from '../types/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const PASSWORD_MIN = 8;

export type RegisterFields = "fullName" | "email" | "recoveryEmail" | "password" | "confirmPassword";
export type LoginFields = 'email' | 'password';
export type ProfileFields = 'fullName' | 'email' | 'username';

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Enter your email address.';
  if (!EMAIL_RE.test(value)) return 'Enter a valid email, like name@ctu.edu.ph.';
  return undefined;
}

export function validateFullName(name: string): string | undefined {
  const value = name.trim();
  if (!value) return 'Enter your full name.';
  if (value.length < 2) return 'Name must be at least 2 characters.';
  if (value.length > 60) return 'Name must be 60 characters or fewer.';
  return undefined;
}

export function validateUsername(username: string): string | undefined {
  const value = username.trim();
  if (!value) return 'Enter a username.';
  if (!USERNAME_RE.test(value)) return 'Use 3–20 letters, numbers, or underscores.';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Create a password.';
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  return undefined;
}

export function validateRegister(values: Record<RegisterFields, string>): FieldErrors<RegisterFields> {
  const errors: FieldErrors<RegisterFields> = {
    fullName: validateFullName(values.fullName),
    email: validateEmail(values.email),
    recoveryEmail: validateEmail(values.recoveryEmail), // Added validation here
    password: validatePassword(values.password)
  };
   if (
    values.email && 
    values.recoveryEmail && 
    values.email.trim().toLowerCase() === values.recoveryEmail.trim().toLowerCase()
  ) {
    errors.recoveryEmail = 'Recovery email must be different from your primary email.';
  }

   if (!values.recoveryEmail.trim()) {
    errors.recoveryEmail = "Recovery email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.recoveryEmail)) {
    errors.recoveryEmail = "Please enter a valid email address.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords don’t match.';
  }

  return clean(errors);

}

export function validateLogin(values: Record<LoginFields, string>): FieldErrors<LoginFields> {
  return clean({
    email: validateEmail(values.email),
    password: values.password ? undefined : 'Enter your password.'
  });
}

export function validateProfile(values: Record<ProfileFields, string>): FieldErrors<ProfileFields> {
  return clean({
    fullName: validateFullName(values.fullName),
    email: validateEmail(values.email),
    username: validateUsername(values.username)
  });
}

export function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

function clean<K extends string>(errors: FieldErrors<K>): FieldErrors<K> {
  const out: FieldErrors<K> = {};
  (Object.keys(errors) as K[]).forEach((k) => {
    if (errors[k]) out[k] = errors[k];
  });
  return out;
}