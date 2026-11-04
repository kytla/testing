/** Private account details. Only ever returned to the authenticated owner. */
export interface PrivateProfile {
  id: string;
  fullName: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface ProfileUpdate {
  fullName: string;
  email: string;
  username: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;
