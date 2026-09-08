"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Client { id: string; firstName: string; lastName: string }
interface Progress { scheduled: number; completed: number; percentage: number; streak: number; latestMessage: { body: string } | null }

function date(daysAgo = 0) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function CoachProgress() {
  const t = useTranslations("Daily");
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [progress, setProgress] = useState<Progress>();
  useEffect(() => { void fetch("/api/workouts/clients").then(async (response) => { if (!response.ok) return; const data = (await response.json()).data as Client[]; setClients(data); setClientId(data[0]?.id ?? ""); }); }, []);
  useEffect(() => { if (!clientId) return; void fetch(`/api/daily/clients/${clientId}/progress?from=${date(6)}&to=${date()}`).then(async (response) => { if (response.ok) setProgress((await response.json()).data); }); }, [clientId]);
  if (!clients.length) return null;
  return <section className="space-y-4"><h2 className="text-2xl font-semibold">{t("clientProgress")}</h2><select className="rounded-md border bg-background p-2" value={clientId} onChange={(event) => setClientId(event.target.value)}>{clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select>{progress && <><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{t("sevenDayAdherence")}</p><p className="text-2xl font-bold">{progress.percentage}%</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{t("completedActions")}</p><p className="text-2xl font-bold">{progress.completed}/{progress.scheduled}</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{t("streak")}</p><p className="text-2xl font-bold">{progress.streak}</p></div></div>{progress.latestMessage && <div className="rounded-xl border p-4"><p className="text-sm font-semibold">{t("latestMessage")}</p><p>{progress.latestMessage.body}</p></div>}</>}</section>;
}
