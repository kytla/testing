import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "ctu-confession:session"; // same key AuthProvider uses

export class ApiError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status: number, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null; // pass explicitly to skip the stored token
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token =
    options.token !== undefined
      ? options.token
      : await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError(data.error ?? "Something went wrong.", res.status, data.field);
  return data as T;
}