"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Offer { id: string; name: string; durationWeeks: number; sessionsIncluded: number; priceUSD: number; isActive: boolean }

export function PackageManager({ coachId }: { coachId: string }) {
  const t = useTranslations("Marketplace");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [message, setMessage] = useState("");
  async function load() { const response = await fetch(`/api/marketplace/packages/coach/${coachId}`); if (response.ok) setOffers((await response.json()).data ?? []); }
  useEffect(() => { void load(); }, [coachId]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/marketplace/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), description: form.get("description"), durationWeeks: Number(form.get("durationWeeks")), sessionsIncluded: Number(form.get("sessionsIncluded")), priceUSD: Number(form.get("priceUSD")), features: String(form.get("features") ?? "").split(",").map((item) => item.trim()).filter(Boolean) }) });
    setMessage(response.ok ? t("saved") : (await response.json()).message ?? t("saveError")); if (response.ok) { event.currentTarget.reset(); await load(); }
  }
  async function change(offer: Offer, updates: Partial<Offer>) { const response = await fetch(`/api/marketplace/packages/${offer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) }); setMessage(response.ok ? t("saved") : t("saveError")); if (response.ok) await load(); }
  return <div className="space-y-8"><form className="grid gap-3 rounded-xl border p-5 md:grid-cols-2" onSubmit={(event) => void create(event)}><Input name="name" required placeholder={t("packageName")} /><Input name="description" placeholder={t("description")} /><select className="rounded-md border bg-background p-2" name="durationWeeks"><option value="4">4 {t("weekLabel")}</option><option value="8">8 {t("weekLabel")}</option><option value="12">12 {t("weekLabel")}</option></select><Input name="sessionsIncluded" required min="1" type="number" placeholder={t("sessionsIncluded")} /><Input name="priceUSD" required min="0.5" step="0.01" type="number" placeholder={t("priceUsd")} /><Input name="features" placeholder={t("features")} /><Button>{t("createPackage")}</Button></form><div className="space-y-3">{offers.map((offer) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" key={offer.id}><div><h2 className="font-semibold">{offer.name}</h2><p className="text-sm text-muted-foreground">${Number(offer.priceUSD).toFixed(2)} · {offer.durationWeeks} {t("weekLabel")}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => { const value = window.prompt(t("newPrice"), String(offer.priceUSD)); if (value) void change(offer, { priceUSD: Number(value) }); }}>{t("editPrice")}</Button><Button variant="secondary" onClick={() => void change(offer, { isActive: !offer.isActive })}>{offer.isActive ? t("deactivate") : t("activate")}</Button></div></article>)}</div>{message && <p role="status">{message}</p>}</div>;
}
