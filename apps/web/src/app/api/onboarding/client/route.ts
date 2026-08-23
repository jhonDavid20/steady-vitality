import { NextRequest, NextResponse } from "next/server";
import { clientOnboardingSchema } from "@steady/shared";
import { apiFetch } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const parsed = clientOnboardingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const res = await apiFetch("/api/users/me/onboarding", {
    method: "PATCH",
    body: JSON.stringify(parsed.data),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success === false) {
    return NextResponse.json(
      { success: false, message: data?.message ?? "No se pudo guardar el onboarding" },
      { status: res.ok ? 400 : res.status },
    );
  }
  return NextResponse.json({ success: true, user: data.user });
}
