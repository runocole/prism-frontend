/**
 * src/lib/auth.ts
 * ────────────────
 * Auth state helpers.
 * Tokens live in localStorage (simple, works with SSR disabled).
 * The user object is cached so HrLayout can read name/role without an API call.
 */

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "hr" | "reviewer";
}

export function saveAuth(access: string, refresh: string, user: AuthUser) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem("access_token");
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}