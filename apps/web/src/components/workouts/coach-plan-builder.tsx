"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Exercise { id: string; name: string }
interface Plan { id: string; name: string }
interface Client { id: string; firstName: string; lastName: string }

export function CoachPlanBuilder() {
  const t = useTranslations("Workouts");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [message, setMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  async function load() {
    const [exerciseResponse, planResponse, clientResponse] = await Promise.all([fetch("/api/workouts/exercises"), fetch("/api/workouts/plans"), fetch("/api/workouts/clients")]);
    if (exerciseResponse.ok) setExercises((await exerciseResponse.json()).data);
    if (planResponse.ok) setPlans((await planResponse.json()).data);
    if (clientResponse.ok) setClients((await clientResponse.json()).data);
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>, path: string, body: Record<string, unknown>) {
    event.preventDefault(); setMessage("");
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? t("saved") : data.message ?? t("saveError"));
    if (response.ok) await load();
  }

  async function upload(file: File) {
    setMessage(t("uploading"));
    const request = await fetch("/api/daily/media/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType: file.type, size: file.size }) });
    if (!request.ok) { setMessage(t("saveError")); return; }
    const target = (await request.json()).data as { uploadUrl: string; publicUrl: string; headers: Record<string, string> };
    const uploaded = await fetch(target.uploadUrl, { method: "PUT", headers: target.headers, body: file });
    if (!uploaded.ok) { setMessage(t("saveError")); return; }
    setVideoUrl(target.publicUrl);
    setMessage(t("uploaded"));
  }

  return <div className="grid gap-8 lg:grid-cols-3">
    <form className="space-y-3" onSubmit={(event) => { const form = new FormData(event.currentTarget); void submit(event, "/api/workouts/exercises", { name: form.get("name"), muscleGroup: form.get("muscleGroup"), videoUrl: videoUrl || null }); }}><h2 className="font-semibold">{t("newExercise")}</h2><Input name="name" required placeholder={t("exerciseName")} /><Input name="muscleGroup" required placeholder={t("muscleGroup")} /><Input name="videoUrl" type="url" placeholder={t("videoUrl")} value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} /><label className="block text-sm text-muted-foreground">{t("uploadMedia")}<Input className="mt-1" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label><Button>{t("create")}</Button></form>
    <form className="space-y-3" onSubmit={(event) => { const form = new FormData(event.currentTarget); void submit(event, "/api/workouts/plans", { name: form.get("name"), items: [{ exerciseId: form.get("exerciseId"), dayOfWeek: Number(form.get("dayOfWeek")), order: 0 }] }); }}><h2 className="font-semibold">{t("newPlan")}</h2><Input name="name" required placeholder={t("planName")} /><select className="w-full rounded-md border bg-background p-2" name="exerciseId" required>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select><select className="w-full rounded-md border bg-background p-2" name="dayOfWeek">{Array.from({ length: 7 }, (_, day) => <option key={day} value={day}>{t(`day.${day}`)}</option>)}</select><Button disabled={!exercises.length}>{t("create")}</Button></form>
    <form className="space-y-3" onSubmit={(event) => { const form = new FormData(event.currentTarget); void submit(event, "/api/workouts/assignments", { planId: form.get("planId"), clientId: form.get("clientId"), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, startsOn: form.get("startsOn") }); }}><h2 className="font-semibold">{t("assignPlan")}</h2><select className="w-full rounded-md border bg-background p-2" name="planId" required>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select><select className="w-full rounded-md border bg-background p-2" name="clientId" required>{clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select><Input name="startsOn" type="date" required /><Button disabled={!plans.length || !clients.length}>{t("assign")}</Button></form>
    {message && <p className="text-sm" role="status">{message}</p>}
  </div>;
}
