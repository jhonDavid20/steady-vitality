"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface WorkoutAction { actionId: string; name: string; completed: boolean }
interface Meal { mealId: string; mealType: string; name: string; calories: number | null; completed: boolean }
interface DailyToday {
  workout: { status: string; assignmentId?: string; planName?: string; completed: number; total: number; actions: WorkoutAction[] };
  nutrition: { status: string; assignmentId?: string; planName?: string; completed: number; total: number; meals: Meal[]; water: { amountMl: number; targetMl: number } };
  streak: number;
  progress: { completed: number; total: number; percentage: number; weight: number | null; targetWeight: number | null };
  checkIn: { id: string; body: string } | null;
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function DailyToday() {
  const t = useTranslations("Daily");
  const [today, setToday] = useState<DailyToday>();
  const [error, setError] = useState(false);
  const date = localDate();

  async function load() {
    const response = await fetch(`/api/daily/today?date=${date}`, { cache: "no-store" });
    if (!response.ok) { setError(true); return; }
    setError(false);
    setToday((await response.json()).data);
  }
  useEffect(() => { void load(); }, []);

  async function update(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) setError(true);
    await load();
  }

  if (!today) return <p className="text-muted-foreground">{error ? t("loadError") : t("loading")}</p>;
  const nextWorkout = today.workout.actions.find((action) => !action.completed);
  const nextMeal = today.nutrition.meals.find((meal) => !meal.completed);

  return <div className="space-y-5">
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">{t("dailyProgress")}</p><p className="text-3xl font-bold">{today.progress.percentage}%</p></div><div className="text-right"><p className="text-sm text-muted-foreground">{t("streak")}</p><p className="text-2xl font-semibold">{t("streakDays", { count: today.streak })}</p></div></div>
      {(nextWorkout || nextMeal) && <p className="mt-4 font-medium">{t("nextAction")}: {nextWorkout?.name ?? nextMeal?.name}</p>}
    </section>
    {today.checkIn && <aside className="rounded-xl border border-primary/30 bg-primary/5 p-4"><p className="text-sm font-semibold">{t("coachCheckIn")}</p><p>{today.checkIn.body}</p></aside>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-3 rounded-xl border p-5"><h2 className="text-xl font-semibold">{t("workout")}</h2>{today.workout.actions.length === 0 && <p className="text-muted-foreground">{t(today.workout.status === "rest" ? "rest" : "noWorkout")}</p>}{today.workout.actions.map((action) => <div className="flex items-center justify-between gap-3" key={action.actionId}><span>{action.name}</span><Button size="sm" variant={action.completed ? "secondary" : "default"} onClick={() => void update("/api/workouts/completions", { assignmentId: today.workout.assignmentId, actionId: action.actionId, localDate: date, completed: !action.completed })}>{action.completed ? t("undo") : t("done")}</Button></div>)}</section>
      <section className="space-y-3 rounded-xl border p-5"><h2 className="text-xl font-semibold">{t("nutrition")}</h2>{today.nutrition.meals.length === 0 && <p className="text-muted-foreground">{t("noMeals")}</p>}{today.nutrition.meals.map((meal) => <div className="flex items-center justify-between gap-3" key={meal.mealId}><span><span className="block text-xs uppercase text-muted-foreground">{meal.mealType}</span>{meal.name}</span><Button size="sm" variant={meal.completed ? "secondary" : "default"} onClick={() => void update("/api/daily/nutrition/completions", { assignmentId: today.nutrition.assignmentId, mealId: meal.mealId, localDate: date, completed: !meal.completed })}>{meal.completed ? t("undo") : t("done")}</Button></div>)}</section>
    </div>
    {today.nutrition.water.targetMl > 0 && <section className="rounded-xl border p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">{t("water")}</h2><p className="text-sm text-muted-foreground">{today.nutrition.water.amountMl} / {today.nutrition.water.targetMl} ml</p></div><Button onClick={() => void update("/api/daily/water", { localDate: date, amountMl: Math.min(today.nutrition.water.amountMl + 250, 20000) })}>{t("addWater")}</Button></div></section>}
    {error && <p className="text-sm text-destructive" role="alert">{t("loadError")}</p>}
  </div>;
}
