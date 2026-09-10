import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth";

export async function POST() {
  const response = await apiFetch("/api/auth/resend-verification", { method: "POST" });
  const data = await response.json().catch(() => ({ success: false, message: "Unable to resend verification email" }));
  return NextResponse.json(data, { status: response.status });
}
