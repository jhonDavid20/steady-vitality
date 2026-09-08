"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Plan { id: string; name: string }
interface Client { id: string; firstName: string; lastName: string }

export function CoachNutritionBuilder() {
  const t = useTranslations("Daily");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const [planResponse, clientResponse] = await Promise.all([fetch("/api/daily/nutrition/plans"), fetch("/api/workouts/clients")]);
    if (planResponse.ok) setPlans((await planResponse.json()).data);
    if (clientResponse.ok) setClients((await clientResponse.json()).data);
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>, path: string, body: Record<string, unknown>) {
    event.preventDefault();
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? t("saved") : data.message ?? t("saveError"));
    if (response.ok) await load();
  }

  return <section className="space-y-4"><h2 className="text-2xl font-semibold">{t("nutritionPlans")}</h2><div className="grid gap-8 lg:grid-cols-2">
    <form className="space-y-3 rounded-xl border p-5" onSubmit={(event) => { const form = new FormData(event.currentTarget); void submit(event, "/api/daily/nutrition/plans", { name: form.get("name"), waterTargetMl: Number(form.get("waterTargetMl")), items: [{ dayOfWeek: Number(form.get("dayOfWeek")), order: 0, mealType: form.get("mealType"), name: form.get("mealName"), calories: Number(form.get("calories")) || null }] }); }}><h3 className="font-semibold">{t("newNutritionPlan")}</h3><Input name="name" required placeholder={t("planName")} /><Input name="mealName" required placeholder={t("mealName")} /><Input name="mealType" required placeholder={t("mealType")} /><Input name="calories" min="0" type="number" placeholder={t("calories")} /><Input name="waterTargetMl" min="0" max="10000" type="number" defaultValue="2000" /><select className="w-full rounded-md border bg-background p-2" name="dayOfWeek">{Array.from({ length: 7 }, (_, day) => <option key={day} value={day}>{t(`day.${day}`)}</option>)}</select><Button>{t("create")}</Button></form>
    <form className="space-y-3 rounded-xl border p-5" onSubmit={(event) => { const form = new FormData(event.currentTarget); void submit(event, "/api/daily/nutrition/assignments", { planId: form.get("planId"), clientId: form.get("clientId"), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, startsOn: form.get("startsOn") }); }}><h3 className="font-semibold">{t("assignNutritionPlan")}</h3><select className="w-full rounded-md border bg-background p-2" name="planId" required>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select><select className="w-full rounded-md border bg-background p-2" name="clientId" required>{clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select><Input name="startsOn" type="date" required /><Button disabled={!plans.length || !clients.length}>{t("assign")}</Button></form>
  </div>{message && <p className="text-sm" role="status">{message}</p>}</section>;
}
