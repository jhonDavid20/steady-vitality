"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Operations {
  purchases: Array<{ id: string; status: string; createdAt: string }>;
  payments: Array<{ id: string; status: string; amountCents: number; currency: string; createdAt: string }>;
  audits: Array<{ id: string; action: string; targetType: string; createdAt: string }>;
  summary: { newLeads: number; pendingInvites: number; users: number };
}

type OperationsDashboardProps = { mode: "overview" | "operations" };

export function OperationsDashboard({ mode }: OperationsDashboardProps) {
  const t = useTranslations("Admin");
  const [data, setData] = useState<Operations>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/marketplace/admin/operations", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("load operations");
        const body = await response.json() as { data: Operations };
        if (active) setData(body.data);
      })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  if (error) return <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">{t("operationsLoadError")}</p>;
  if (!data) return <div aria-label={t("loading")} className="grid gap-4 sm:grid-cols-3"><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /></div>;

  const metrics = [[t("newLeads"), data.summary.newLeads], [t("pendingInvites"), data.summary.pendingInvites], [t("usersMetric"), data.summary.users]] as const;
  const paymentRows = data.payments.map((item) => `${item.status} · ${formatAmount(item.amountCents, item.currency)} · ${formatDate(item.createdAt)}`);
  const auditRows = data.audits.map((item) => `${item.action} · ${item.targetType} · ${formatDate(item.createdAt)}`);
  const purchaseRows = data.purchases.map((item) => `${item.status} · ${formatDate(item.createdAt)}`);

  if (mode === "overview") {
    return <div className="space-y-6"><section className="grid gap-4 sm:grid-cols-3">{metrics.map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}</section><section className="grid gap-5 lg:grid-cols-2"><ActivityCard emptyLabel={t("noPayments")} rows={paymentRows.slice(0, 5)} title={t("recentPayments")} /><ActivityCard emptyLabel={t("noAuditActivity")} rows={auditRows.slice(0, 5)} title={t("recentActivity")} /></section></div>;
  }

  return <div className="space-y-6"><section className="grid gap-4 sm:grid-cols-3">{metrics.map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}</section><section className="grid gap-5 lg:grid-cols-3"><ActivityCard emptyLabel={t("noPurchases")} rows={purchaseRows} title={t("recentPurchases")} /><ActivityCard emptyLabel={t("noPayments")} rows={paymentRows} title={t("payments")} /><ActivityCard emptyLabel={t("noAuditActivity")} rows={auditRows} title={t("auditTrail")} /></section></div>;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></div>;
}

function ActivityCard({ emptyLabel, rows, title }: { emptyLabel: string; rows: string[]; title: string }) {
  return <section className="min-h-40 rounded-2xl border border-border/80 bg-card p-5 shadow-sm"><h3 className="font-semibold tracking-tight">{title}</h3>{rows.length > 0 ? <ul className="mt-4 space-y-3 text-sm leading-5 text-muted-foreground">{rows.slice(0, 10).map((row, index) => <li className="border-b border-border/60 pb-3 last:border-0 last:pb-0" key={`${row}-${index}`}>{row}</li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">{emptyLabel}</p>}</section>;
}

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(amountCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
