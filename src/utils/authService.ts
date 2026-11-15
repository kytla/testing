/**
 * Real auth service: talks to the Express API.
 * The post-ownership helpers still use on-device storage until the confessions
 * endpoints exist (then the database's author_id replaces them).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ApiError } from "../lib/api";
import type { PrivateProfile, ProfileUpdate, RegisterInput } from "../types/auth";

export class AuthError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.field = field;
  }
}

interface ServerUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
}

// The database has no username column. The app's types still expect one,
// so we show the part of the email before the @.
const toProfile = (u: ServerUser): PrivateProfile => ({
  id: u.id,
  fullName: u.full_name,
  email: u.email,
  username: u.email.split("@")[0],
  role: u.role === "admin" ? "admin" : "student",
  createdAt: u.created_at ?? new Date().toISOString(),
});


async function call<T>(path: string, options?: Parameters<typeof api>[1]): Promise<T> {
  try {
    return await api<T>(path, options);
  } catch (e) {
    if (e instanceof ApiError) throw new AuthError(e.message, e.status, e.field);
    throw e;
  }
}

// --- Temporary on-device post ownership (replace when confessions go to the API) ---
const OWNERS_KEY = "ctu-confession:post-owners";

async function readOwners(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(OWNERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function writeOwners(owners: Record<string, string>) {
  try {
    await AsyncStorage.setItem(OWNERS_KEY, JSON.stringify(owners));
  } catch {
    // storage unavailable
  }
}

async function currentUserId(token: string): Promise<string> {
  const { user } = await call<{ user: ServerUser }>("/auth/me", { token });
  return user.id;
}

export const authService = {
  async register({ fullName, email, recoveryEmail, password }: RegisterInput): Promise<void> {
    await call("/auth/register", {
      method: "POST",
      body: { 
        full_name: fullName, 
        email, 
        recovery_email: recoveryEmail, // Map to backend snake_case
        password 
      },
    });
  },

  async login(email: string, password: string): Promise<string> {
    const { token } = await call<{ token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return token;
  },

  // Tokens are stateless, so logging out just means the app forgets it.
  async logout(_token: string): Promise<void> {},

  async getMe(token: string): Promise<PrivateProfile> {
    const { user } = await call<{ user: ServerUser }>("/auth/me", { token });
    return toProfile(user);
  },

  // The username isn't stored anymore, so only name and email are saved.
  async updateMe(token: string, update: ProfileUpdate): Promise<PrivateProfile> {
    const { user } = await call<{ user: ServerUser }>("/auth/me", {
      method: "PATCH",
      token,
      body: { full_name: update.fullName, email: update.email },
    });
    return toProfile(user);
  },

  // Password reset needs the OTP endpoints. The old fake behavior is kept for now.
  async requestPasswordReset(_email: string): Promise<void> {},

  async listMyPostIds(token: string): Promise<string[]> {
    const userId = await currentUserId(token);
    const owners = await readOwners();
    return Object.keys(owners).filter((postId) => owners[postId] === userId);
  },

  async claimPost(token: string, postId: string): Promise<void> {
    const userId = await currentUserId(token);
    const owners = await readOwners();
    if (owners[postId]) throw new AuthError("This post already has an owner.", 409);
    owners[postId] = userId;
    await writeOwners(owners);
  },

  async deletePost(token: string, postId: string): Promise<void> {
    const userId = await currentUserId(token);
    const owners = await readOwners();
    if (owners[postId] !== userId)
      throw new AuthError("You can only delete your own confessions.", 403);
    delete owners[postId];
    await writeOwners(owners);
  },
};


