"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Client { relationshipId: string; startedAt: string; client: { id: string; firstName: string; lastName: string; email: string; profile: { fitnessGoal?: string; activityLevel?: string } | null } }

export function CoachClients({ locale }: { locale: string }) {
  const t = useTranslations("Clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => { void fetch("/api/marketplace/coaches/me/clients").then(async (response) => { if (response.ok) setClients((await response.json()).data ?? []); else setError(true); }); }, []);
  return <section className="space-y-6"><div><h1 className="text-3xl font-bold">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div>{error ? <p className="text-destructive">{t("loadError")}</p> : clients.length === 0 ? <div className="rounded-xl border p-5"><p className="text-muted-foreground">{t("empty")}</p><Link className="mt-3 inline-block text-sm font-medium underline" href={`/${locale}/packages`}>{t("managePackages")}</Link></div> : <div className="grid gap-4 md:grid-cols-2">{clients.map(({ relationshipId, startedAt, client }) => <article className="rounded-xl border p-5" key={relationshipId}><h2 className="font-semibold">{client.firstName} {client.lastName}</h2><p className="text-sm text-muted-foreground">{client.email}</p><p className="mt-3 text-sm">{client.profile?.fitnessGoal ?? t("noGoal")} · {client.profile?.activityLevel ?? t("noActivity")}</p><p className="mt-3 text-xs text-muted-foreground">{t("since", { date: new Date(startedAt).toLocaleDateString() })}</p></article>)}</div>}</section>;
}
