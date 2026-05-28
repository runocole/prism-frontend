/**
 * src/services/auth.service.ts
 * ─────────────────────────────
 * Login and logout API calls.
 */

import { api } from "@/lib/api";
import { saveAuth, clearAuth, type AuthUser } from "@/lib/auth";

interface LoginResponse {
  success: boolean;
  data: {
    access: string;
    refresh: string;
    user: AuthUser;
  };
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<LoginResponse>("/auth/login/", { email, password });
  saveAuth(data.data.access, data.data.refresh, data.data.user);
  return data.data.user;
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await api.post("/auth/logout/", { refresh: refreshToken });
  } finally {
    // Always clear local tokens even if server call fails
    clearAuth();
  }
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<{ success: boolean; data: AuthUser }>("/auth/me/");
  return data.data;
}