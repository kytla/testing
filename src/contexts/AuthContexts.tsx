import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type {
    AuthStatus,
    PrivateProfile,
    ProfileUpdate,
    RegisterInput,
} from "../types/auth";
import { AuthError, authService } from "../utils/authService";

interface AuthContextValue {
  status: AuthStatus;
  user: PrivateProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<PrivateProfile>;
  requestPasswordReset: (email: string) => Promise<void>;
}

const TOKEN_KEY = "ctu-confession:session";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PrivateProfile | null>(null);
  // AsyncStorage is async, so we can't know yet whether a session exists.
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(() => {
    void writeToken(null);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // Restore an existing session on launch.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = await readToken();
      if (cancelled) return;

      if (!saved) {
        setStatus("unauthenticated");
        return;
      }

      setToken(saved);
      try {
        const profile = await authService.getMe(saved);
        if (cancelled) return;
        setUser(profile);
        setStatus("authenticated");
      } catch {
        if (!cancelled) clearSession();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const newToken = await authService.login(email, password);
    const profile = await authService.getMe(newToken);
    await writeToken(newToken);
    setToken(newToken);
    setUser(profile);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    (input: RegisterInput) => authService.register(input),
    [],
  );

  const logout = useCallback(async () => {
    try {
      if (token) await authService.logout(token);
    } finally {
      clearSession();
    }
  }, [token, clearSession]);

  const updateProfile = useCallback(
    async (update: ProfileUpdate) => {
      try {
        const updated = await authService.updateMe(token ?? "", update);
        setUser(updated);
        return updated;
      } catch (err) {
        if (err instanceof AuthError && err.status === 401) clearSession();
        throw err;
      }
    },
    [token, clearSession],
  );

  const requestPasswordReset = useCallback(
    (email: string) => authService.requestPasswordReset(email),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      login,
      register,
      logout,
      updateProfile,
      requestPasswordReset,
    }),
    [
      status,
      user,
      token,
      login,
      register,
      logout,
      updateProfile,
      requestPasswordReset,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function readToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function writeToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable
  }
}
