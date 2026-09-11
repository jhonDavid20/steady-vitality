"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LeadStatus = "new" | "contacted" | "converted" | "archived";
type Lead = { id: string; name: string; email: string; age: string | null; gender: string | null; height: number | null; weight: number | null; activityLevel: string | null; goal: string | null; experience: string | null; bmi: number | null; locale: string | null; status: LeadStatus; createdAt: string };
type LeadResponse = { data: Lead[]; pagination: { total: number } };
const statuses: LeadStatus[] = ["new", "contacted", "converted", "archived"];

export function AdminLeads() {
  const t = useTranslations("Admin");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState<{ lead: Lead; status: LeadStatus }>();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("status", filter);
    try { const response = await fetch(`/api/marketplace/leads?${params}`); if (!response.ok) throw new Error("load leads"); setLeads((await response.json() as LeadResponse).data); } catch { setError(true); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { void load(); }, [load]);
  const visibleLeads = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? leads.filter((lead) => `${lead.name} ${lead.email} ${lead.goal ?? ""}`.toLowerCase().includes(needle)) : leads; }, [leads, query]);

  async function confirmStatus() {
    if (!pending) return; setSaving(true);
    try { const response = await fetch(`/api/marketplace/leads/${pending.lead.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: pending.status }) }); if (!response.ok) throw new Error("update lead"); setPending(undefined); await load(); } catch { setError(true); } finally { setSaving(false); }
  }

  return <section className="space-y-5"><div><h2 className="text-2xl font-semibold tracking-tight">{t("leadsTitle")}</h2><p className="text-muted-foreground">{t("leadsDescription")}</p></div>
    <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_12rem]"><Input aria-label={t("searchLeads")} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchLeads")} value={query} /><Select onValueChange={(value) => setFilter(value as "all" | LeadStatus)} value={filter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("allLeadStatuses")}</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{t(`leadStates.${status}`)}</SelectItem>)}</SelectContent></Select></div>
    {loading ? <div className="space-y-3" aria-label={t("loading")}><div className="h-14 animate-pulse rounded-lg bg-muted" /><div className="h-14 animate-pulse rounded-lg bg-muted" /></div> : null}
    {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"><p className="font-medium">{t("leadLoadError")}</p><Button className="mt-3" onClick={() => void load()} variant="outline">{t("retry")}</Button></div> : null}
    {!loading && !error && visibleLeads.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center"><h3 className="font-medium">{t("emptyLeadsTitle")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("emptyLeadsDescription")}</p></div> : null}
    {!loading && !error && visibleLeads.length > 0 ? <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("lead")}</th><th className="px-4 py-3 font-medium">{t("goal")}</th><th className="px-4 py-3 font-medium">{t("leadStatus")}</th><th className="px-4 py-3 font-medium">{t("received")}</th><th className="px-4 py-3 font-medium"><span className="sr-only">{t("actions")}</span></th></tr></thead><tbody>{visibleLeads.map((lead) => <tr className="border-b last:border-0" key={lead.id}><td className="px-4 py-4"><p className="font-medium">{lead.name}</p><p className="text-muted-foreground">{lead.email}</p></td><td className="px-4 py-4 text-muted-foreground">{lead.goal ?? "—"}</td><td className="px-4 py-4"><Select onValueChange={(value) => setPending({ lead, status: value as LeadStatus })} value={lead.status}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{t(`leadStates.${status}`)}</SelectItem>)}</SelectContent></Select></td><td className="px-4 py-4 text-muted-foreground">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(lead.createdAt))}</td><td className="px-4 py-4 text-right"><span className="text-xs text-muted-foreground">{lead.locale?.toUpperCase() ?? "—"}</span></td></tr>)}</tbody></table></div> : null}
    <Dialog onOpenChange={(open) => { if (!open) setPending(undefined); }} open={Boolean(pending)}><DialogContent><DialogHeader><DialogTitle>{t("confirmLeadStatusTitle")}</DialogTitle><DialogDescription>{t("confirmLeadStatusDescription", { name: pending?.lead.name ?? "", status: pending ? t(`leadStates.${pending.status}`) : "" })}</DialogDescription></DialogHeader><DialogFooter><Button disabled={saving} onClick={() => setPending(undefined)} variant="outline">{t("cancel")}</Button><Button disabled={saving} onClick={() => void confirmStatus()}>{saving ? t("saving") : t("confirm")}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
