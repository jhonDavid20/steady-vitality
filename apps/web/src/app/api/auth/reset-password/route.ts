import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload.token !== "string" || typeof payload.newPassword !== "string") {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
