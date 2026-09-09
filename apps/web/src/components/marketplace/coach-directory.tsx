"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Coach { id: string; firstName: string; lastName: string; profileHeadline?: string; specialties: string[]; sessionRateUSD?: number }

export function CoachDirectory() {
  const t = useTranslations("Marketplace");
  const locale = useLocale();
  const [coaches, setCoaches] = useState<Coach[]>([]);

  async function load(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const form = event ? new FormData(event.currentTarget) : new FormData();
    const params = new URLSearchParams();
    for (const key of ["specialty", "coachingType", "maxPrice"]) {
      const value = form.get(key);
      if (value) params.set(key, String(value));
    }
    const response = await fetch(`/api/marketplace/coaches?${params}`);
    if (response.ok) setCoaches((await response.json()).data ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function match(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/marketplace/coaches/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    if (response.ok) setCoaches((await response.json()).data ?? []);
  }

  return <div className="space-y-8">
    <form className="grid gap-3 rounded-xl border p-5 md:grid-cols-5" onSubmit={(event) => void load(event)}>
      <Input className="md:col-span-2" name="specialty" placeholder={t("specialty")} />
      <select className="rounded-md border bg-background p-2" name="coachingType"><option value="">{t("allTypes")}</option><option value="online">{t("online")}</option><option value="in_person">{t("inPerson")}</option><option value="hybrid">{t("hybrid")}</option></select>
      <Input name="maxPrice" type="number" placeholder={t("maxPrice")} />
      <Button>{t("search")}</Button>
    </form>
    <form className="grid gap-3 rounded-xl border p-5 md:grid-cols-5" onSubmit={(event) => void match(event)}>
      <select className="rounded-md border bg-background p-2" name="fitnessGoal"><option value="weight_loss">{t("weightLoss")}</option><option value="muscle_gain">{t("muscleGain")}</option><option value="general_fitness">{t("generalFitness")}</option></select>
      <select className="rounded-md border bg-background p-2" name="activityLevel"><option value="sedentary">{t("beginning")}</option><option value="moderately_active">{t("active")}</option></select>
      <select className="rounded-md border bg-background p-2" name="communicationPreference"><option value="messages">{t("messages")}</option><option value="calls">{t("calls")}</option><option value="mixed">{t("mixed")}</option></select>
      <select className="rounded-md border bg-background p-2" name="trainingExperience"><option value="beginner">{t("beginner")}</option><option value="intermediate">{t("intermediate")}</option><option value="advanced">{t("advanced")}</option></select>
      <Button variant="secondary">{t("match")}</Button>
    </form>
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{coaches.map((coach) => <article className="rounded-xl border p-5" key={coach.id}><h2 className="text-xl font-semibold">{coach.firstName} {coach.lastName}</h2><p className="text-muted-foreground">{coach.profileHeadline}</p><p className="mt-3 text-sm">{coach.specialties.join(" · ")}</p><p className="mt-2 text-sm">{coach.sessionRateUSD ? `$${coach.sessionRateUSD} USD` : t("priceOnProfile")}</p><Link className="mt-4 inline-block underline" href={`/${locale}/coach/${coach.id}`}>{t("viewProfile")}</Link></article>)}</div>
  </div>;
}
