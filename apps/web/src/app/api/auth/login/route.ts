import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@steady/shared";
import { setAuthCookies } from "@/lib/auth";

const API_URL = process.env.API_URL;

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (!API_URL) {
    return NextResponse.json({ success: false, message: "API no configurada" }, { status: 503 });
  }

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.tokens) {
    return NextResponse.json(
      { success: false, message: data?.message ?? "No se pudo iniciar sesión" },
      { status: res.ok ? 401 : res.status },
    );
  }

  await setAuthCookies(data.tokens);
  return NextResponse.json({ success: true, user: data.user });
}
