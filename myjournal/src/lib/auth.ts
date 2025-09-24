import { API_BASE_URL } from "./config";

// In-memory access token (preferred) + sync with localStorage for other consumers
let accessToken: string | null = null;

export const auth = {
  getAccessToken(): string | null {
    if (accessToken) return accessToken;
    if (typeof window !== "undefined") {
      accessToken = localStorage.getItem("bearer_token");
    }
    return accessToken;
  },
  setAccessToken(token: string | null) {
    accessToken = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("bearer_token", token);
      else localStorage.removeItem("bearer_token");
    }
  },
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export async function registerUser(payload: RegisterPayload) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include", // allow backend to set refresh token cookie
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Registration failed");
  }
  return data;
}

export async function loginUser(payload: LoginPayload) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Invalid email or password");
  }
  // Expect backend to return { access_token: string }
  if (data?.access_token) {
    auth.setAccessToken(data.access_token);
  }
  return data;
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    auth.setAccessToken(null);
  }
}

export async function getMe() {
  const token = auth.getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (res.status === 401) return null;
  const data = await res.json().catch(() => null);
  return data;
}