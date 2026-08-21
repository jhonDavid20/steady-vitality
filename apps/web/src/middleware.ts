import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const ACCESS = "sv_access";
const REFRESH = "sv_refresh";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** true when the JWT is missing or expiring within 60s (no verification needed here). */
function expiringSoon(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload));
    return !exp || exp * 1000 - Date.now() < 60_000;
  } catch {
    return true;
  }
}

export default async function middleware(req: NextRequest) {
  const access = req.cookies.get(ACCESS)?.value;
  const refresh = req.cookies.get(REFRESH)?.value;

  const res = intl(req) ?? NextResponse.next();

  // Keep the session fresh transparently: refresh the access token before it expires.
  if (refresh && expiringSoon(access) && process.env.API_URL) {
    try {
      const r = await fetch(`${process.env.API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
        cache: "no-store",
      });
      if (r.ok) {
        const data = await r.json();
        const tokens = data?.tokens;
        if (tokens?.accessToken) {
          const opts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
            maxAge: SESSION_MAX_AGE,
          };
          res.cookies.set(ACCESS, tokens.accessToken, opts);
          if (tokens.refreshToken) res.cookies.set(REFRESH, tokens.refreshToken, opts);
        }
      }
    } catch {
      // best-effort; getServerUser also refreshes in-memory if needed
    }
  }

  return res;
}

export const config = {
  matcher: ["/", "/(en|es)/:path*"],
};
