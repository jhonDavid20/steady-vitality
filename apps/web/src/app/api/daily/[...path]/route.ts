import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const url = `/api/daily/${path.join("/")}${request.nextUrl.search}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  try {
    const response = await apiFetch(url, { method: request.method, body, headers: { "Content-Type": request.headers.get("content-type") ?? "application/json" } });
    return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ success: false, message: "Backend unavailable" }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
