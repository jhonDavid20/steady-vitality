import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@steady/shared";
import { setAuthCookies } from "@/lib/auth";

const API_URL = process.env.API_URL;

export async function POST(req: NextRequest) {
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (!API_URL) {
    return NextResponse.json({ success: false, message: "API no configurada" }, { status: 503 });
  }

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { success: false, message: data?.message ?? "No se pudo crear la cuenta" },
      { status: res.status },
    );
  }

  // Auto-login when the backend returns tokens on registration.
  if (data?.tokens) await setAuthCookies(data.tokens);
  return NextResponse.json({ success: true, user: data.user, autoLogin: Boolean(data?.tokens) });
}
