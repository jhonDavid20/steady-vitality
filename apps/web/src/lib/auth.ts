import { cookies } from "next/headers";
import type { AuthUser, AuthTokens, AuthResponse } from "@steady/shared";

/**
 * Server-side auth helpers. Tokens live in httpOnly cookies; the browser never
 * sees them. The backend base URL is server-only (`API_URL`, no NEXT_PUBLIC_).
 */

const API_URL = process.env.API_URL;
export const ACCESS_COOKIE = "sv_access";
export const REFRESH_COOKIE = "sv_refresh";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function apiBase(): string {
  if (!API_URL) throw new Error("API_URL is not configured");
  return API_URL;
}

function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function setAuthCookies(tokens: AuthTokens): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, cookieOpts());
  store.set(REFRESH_COOKIE, tokens.refreshToken, cookieOpts());
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

/** Authenticated call to the backend with a given (or the current) access token. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<Response> {
  const access = token ?? (await getAccessToken());
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);
  return fetch(`${apiBase()}${path}`, { ...init, headers, cache: "no-store" });
}

/** Exchange a refresh token for fresh tokens (backend does NOT rotate the refresh token). */
export async function refreshTokens(refreshToken: string): Promise<AuthResponse | null> {
  try {
    const res = await fetch(`${apiBase()}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthResponse;
  } catch {
    return null;
  }
}

async function fetchMe(accessToken: string): Promise<AuthUser | null> {
  try {
    const res = await apiFetch("/api/auth/me", { method: "GET" }, accessToken);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.user ?? data.data ?? null) as AuthUser | null;
  } catch {
    return null;
  }
}

/**
 * Returns the current authenticated user, or null. Robust to an expired access
 * token: if `/me` fails and a refresh token is present, it refreshes in-memory
 * and uses the user returned by the refresh. Cookie persistence is handled by
 * the middleware so subsequent requests hit the happy path.
 */
export async function getServerUser(): Promise<AuthUser | null> {
  const access = await getAccessToken();
  if (access) {
    const user = await fetchMe(access);
    if (user) return user;
  }

  const refresh = await getRefreshToken();
  if (!refresh) return null;

  const refreshed = await refreshTokens(refresh);
  if (!refreshed?.success) return null;
  if (refreshed.user) return refreshed.user;
  if (refreshed.tokens) return await fetchMe(refreshed.tokens.accessToken);
  return null;
}
