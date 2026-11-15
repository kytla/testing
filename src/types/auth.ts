/** Private account details. Only ever returned to the authenticated owner. */
export interface PrivateProfile {
  id: string;
  fullName: string;
  email: string;
  username: string;
  createdAt: string;
  recoveryEmail?: string; // Add this (optional for profile display)
}

export interface RegisterInput {
  fullName: string;
  email: string;
  recoveryEmail: string; // ADD THIS LINE
  password: string;
}

// ... rest of the file stays the same
export interface ProfileUpdate {
  fullName: string;
  email: string;
  username: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;
