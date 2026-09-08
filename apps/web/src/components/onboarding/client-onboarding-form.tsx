"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  FITNESS_GOALS,
  PROFILE_ACTIVITY_LEVELS,
  PROFILE_GENDERS,
} from "@steady/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

interface FormValues {
  fitnessGoal: string;
  activityLevel: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  targetWeight: string;
  injuries: string;
  preferredWorkoutTime: string;
}

export function ClientOnboardingForm() {
  const t = useTranslations("Onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>();

  useEffect(() => {
    const saved = window.localStorage.getItem("sv:onboarding:client");
    if (saved) {
      try {
        for (const [field, value] of Object.entries(JSON.parse(saved))) setValue(field as keyof FormValues, value as never);
      } catch { window.localStorage.removeItem("sv:onboarding:client"); }
    }
    const subscription = watch((values) => window.localStorage.setItem("sv:onboarding:client", JSON.stringify(values)));
    return () => subscription.unsubscribe();
  }, [setValue, watch]);

  const onSubmit = async (v: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        fitnessGoal: v.fitnessGoal,
        activityLevel: v.activityLevel,
        dateOfBirth: v.dateOfBirth,
        gender: v.gender,
        height: v.height,
        weight: v.weight,
        targetWeight: v.targetWeight || undefined,
        injuries: v.injuries
          ? v.injuries.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        preferredWorkoutTime: v.preferredWorkoutTime || undefined,
      };
      const res = await fetch("/api/onboarding/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? t("error"));
        return;
      }
      window.localStorage.removeItem("sv:onboarding:client");
      router.replace(`/${locale}/today`);
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fitnessGoal">{t("goal")}</Label>
        <select id="fitnessGoal" className={selectClass} required {...register("fitnessGoal")}>
          <option value="">{t("selectPlaceholder")}</option>
          {FITNESS_GOALS.map((g) => (
            <option key={g} value={g}>{t(`goalOpt.${g}`)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="activityLevel">{t("activity")}</Label>
        <select id="activityLevel" className={selectClass} required {...register("activityLevel")}>
          <option value="">{t("selectPlaceholder")}</option>
          {PROFILE_ACTIVITY_LEVELS.map((a) => (
            <option key={a} value={a}>{t(`activityOpt.${a}`)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">{t("dateOfBirth")}</Label>
          <Input id="dateOfBirth" type="date" required {...register("dateOfBirth")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">{t("gender")}</Label>
          <select id="gender" className={selectClass} required {...register("gender")}>
            <option value="">{t("selectPlaceholder")}</option>
            {PROFILE_GENDERS.map((g) => (
              <option key={g} value={g}>{t(`genderOpt.${g}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="height">{t("height")}</Label>
          <Input id="height" type="number" step="0.1" required {...register("height")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weight">{t("weight")}</Label>
          <Input id="weight" type="number" step="0.1" required {...register("weight")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetWeight">{t("targetWeight")}</Label>
          <Input id="targetWeight" type="number" step="0.1" {...register("targetWeight")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="injuries">{t("injuries")}</Label>
        <Input id="injuries" placeholder={t("injuriesHint")} {...register("injuries")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="preferredWorkoutTime">{t("preferredWorkoutTime")}</Label>
        <select id="preferredWorkoutTime" className={selectClass} {...register("preferredWorkoutTime")}>
          <option value="">{t("selectPlaceholder")}</option>
          {["morning", "afternoon", "evening", "flexible"].map((w) => (
            <option key={w} value={w}>{t(`workoutTimeOpt.${w}`)}</option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("saving") : t("cta")}
      </Button>
    </form>
  );
}
