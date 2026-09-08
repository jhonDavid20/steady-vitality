import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/auth';

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `/api/workouts/${path.join('/')}${req.nextUrl.search}`;
  const body = req.method === 'GET' || req.method === 'DELETE' ? undefined : await req.text();
  const response = await apiFetch(target, { method: req.method, body });
  if (response.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
