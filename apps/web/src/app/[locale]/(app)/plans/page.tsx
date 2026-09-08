import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerUser } from "@/lib/auth";
import { CoachPlanBuilder } from "@/components/workouts/coach-plan-builder";
import { CoachNutritionBuilder } from "@/components/daily/coach-nutrition-builder";
import { CoachProgress } from "@/components/daily/coach-progress";

export default async function PlansPage({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user, t] = await Promise.all([params, getServerUser(), getTranslations("Workouts")]);
  if (!user || user.role !== "coach") redirect(`/${locale}/today`);
  return <section className="space-y-10"><h1 className="text-3xl font-bold">{t("plans")}</h1><CoachProgress /><CoachPlanBuilder /><CoachNutritionBuilder /></section>;
}
