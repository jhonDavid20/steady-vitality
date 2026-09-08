"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Action { actionId: string; name: string; muscleGroup: string; description: string | null; videoUrl: string | null; completed: boolean }
interface Today { status: "no_plan" | "rest" | "active" | "completed"; assignmentId?: string; planName?: string; completed: number; total: number; actions: Action[] }

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function WorkoutToday() {
  const t = useTranslations("Workouts");
  const [today, setToday] = useState<Today>();
  const [error, setError] = useState(false);
  const date = localDate();

  async function load() {
    const response = await fetch(`/api/workouts/today?date=${date}`, { cache: "no-store" });
    if (!response.ok) { setError(true); return; }
    setToday((await response.json()).data);
  }
  useEffect(() => { void load(); }, []);

  async function toggle(action: Action) {
    if (!today?.assignmentId) return;
    const completed = !action.completed;
    setToday({ ...today, actions: today.actions.map((item) => item.actionId === action.actionId ? { ...item, completed } : item), completed: today.completed + (completed ? 1 : -1) });
    const response = await fetch("/api/workouts/completions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId: today.assignmentId, actionId: action.actionId, localDate: date, completed }) });
    if (!response.ok) { setError(true); await load(); }
  }

  if (error) return <p className="text-sm text-destructive" role="alert">{t("loadError")}</p>;
  if (!today) return <p className="text-muted-foreground">{t("loading")}</p>;
  if (today.status === "no_plan") return <p className="text-muted-foreground">{t("noPlan")}</p>;
  if (today.status === "rest") return <p className="text-muted-foreground">{t("rest")}</p>;
  return <div className="space-y-4"><div><h2 className="text-xl font-semibold">{today.planName}</h2><p className="text-sm text-muted-foreground">{t("progress", { done: today.completed, total: today.total })}</p></div><div className="space-y-3">{today.actions.map((action) => <article key={action.actionId} className="rounded-lg border p-4 flex items-center justify-between gap-4"><div><h3 className="font-medium">{action.name}</h3><p className="text-sm text-muted-foreground">{action.muscleGroup}</p>{action.videoUrl && <a className="text-sm underline" href={action.videoUrl} target="_blank" rel="noreferrer">{t("demo")}</a>}</div><Button variant={action.completed ? "secondary" : "default"} onClick={() => void toggle(action)}>{action.completed ? t("undo") : t("complete")}</Button></article>)}</div></div>;
}
