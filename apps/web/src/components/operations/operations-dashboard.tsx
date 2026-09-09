"use client";

import { useEffect, useState } from "react";

interface Operations { purchases: Array<{ id: string; status: string; createdAt: string }>; payments: Array<{ id: string; status: string; amountCents: number; currency: string; createdAt: string }>; audits: Array<{ id: string; action: string; targetType: string; createdAt: string }>; summary: { newLeads: number; pendingInvites: number; users: number } }

export function OperationsDashboard() {
  const [data, setData] = useState<Operations>();
  const [error, setError] = useState(false);
  useEffect(() => { void fetch("/api/marketplace/admin/operations", { cache: "no-store" }).then(async (response) => { if (response.ok) setData((await response.json()).data); else setError(true); }); }, []);
  if (error) return <p className="text-destructive">Unable to load operations.</p>;
  if (!data) return <p className="text-muted-foreground">Loading operations…</p>;
  return <div className="space-y-6"><section className="grid gap-4 sm:grid-cols-3">{[["New leads", data.summary.newLeads], ["Pending invites", data.summary.pendingInvites], ["Users", data.summary.users]].map(([label, value]) => <div className="rounded-xl border p-4" key={String(label)}><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div>)}</section><div className="grid gap-6 md:grid-cols-3">{[["Recent purchases", data.purchases.map((item) => `${item.status} · ${new Date(item.createdAt).toLocaleDateString()}`)], ["Payments", data.payments.map((item) => `${item.status} · ${(item.amountCents / 100).toFixed(2)} ${item.currency.toUpperCase()}`)], ["Audit trail", data.audits.map((item) => `${item.action} · ${item.targetType}`)]].map(([title, rows]) => <section className="rounded-xl border p-5" key={String(title)}><h2 className="font-semibold">{title}</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{(rows as string[]).slice(0, 10).map((row, index) => <li key={`${row}-${index}`}>{row}</li>)}</ul></section>)}</div></div>;
}
