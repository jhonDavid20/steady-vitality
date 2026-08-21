import { NextResponse } from "next/server";
import { apiFetch, clearAuthCookies, getAccessToken } from "@/lib/auth";

export async function POST() {
  try {
    const access = await getAccessToken();
    if (access && process.env.API_URL) {
      await apiFetch("/api/auth/logout", { method: "POST" }, access).catch(() => {});
    }
  } finally {
    await clearAuthCookies();
  }
  return NextResponse.json({ success: true });
}
