/**
 * src/lib/api.ts
 * ───────────────
 * Axios instance pre-configured for the OTIC backend.
 *
 * - Automatically attaches the JWT access token to every request
 * - On 401, attempts a token refresh and retries the original request once
 * - On refresh failure, clears auth and redirects to /hr/login
 */

import axios, { type AxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only intercept 401s that haven't already been retried
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Queue parallel requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (original.headers) original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      clearAuth();
      window.location.href = "/hr/login";
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
        refresh: refreshToken,
      });

      const newAccess: string = data.access;
      localStorage.setItem("access_token", newAccess);
      if (data.refresh) localStorage.setItem("refresh_token", data.refresh);

      processQueue(null, newAccess);
      if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuth();
      window.location.href = "/hr/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

/**
 * A fetch wrapper that automatically adds the Authorization header
 * and refreshes the token if expired — for use outside axios.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("access_token");
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(url, { ...options, headers });

  // If 401, try to refresh and retry once
  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      clearAuth();
      window.location.href = "/hr/login";
      return res;
    }

    const refreshRes = await fetch(
      `${import.meta.env.VITE_API_URL}/auth/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      },
    );

    if (!refreshRes.ok) {
      clearAuth();
      window.location.href = "/hr/login";
      return res;
    }

    const data = await refreshRes.json();
    localStorage.setItem("access_token", data.access);
    if (data.refresh) localStorage.setItem("refresh_token", data.refresh);

    // Retry original request with new token
    res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${data.access}`,
      },
    });
  }

  return res;
}