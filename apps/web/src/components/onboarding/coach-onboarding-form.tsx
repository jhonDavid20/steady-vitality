"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { COACHING_TYPES } from "@steady/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

interface FormValues {
  profileHeadline: string;
  bio: string;
  specialties: string;
  coachingType: string;
  yearsOfExperience: string;
  sessionRateUSD: string;
  acceptingClients: boolean;
}

export function CoachOnboardingForm() {
  const t = useTranslations("Onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { acceptingClients: true },
  });

  useEffect(() => {
    const saved = window.localStorage.getItem("sv:onboarding:coach");
    if (saved) {
      try {
        for (const [field, value] of Object.entries(JSON.parse(saved))) setValue(field as keyof FormValues, value as never);
      } catch { window.localStorage.removeItem("sv:onboarding:coach"); }
    }
    const subscription = watch((values) => window.localStorage.setItem("sv:onboarding:coach", JSON.stringify(values)));
    return () => subscription.unsubscribe();
  }, [setValue, watch]);

  const onSubmit = async (v: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        profileHeadline: v.profileHeadline || undefined,
        bio: v.bio || undefined,
        specialties: v.specialties
          ? v.specialties.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        coachingType: v.coachingType || undefined,
        yearsOfExperience: v.yearsOfExperience || undefined,
        sessionRateUSD: v.sessionRateUSD || undefined,
        acceptingClients: v.acceptingClients,
      };
      const res = await fetch("/api/onboarding/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message ?? t("error"));
        return;
      }
      window.localStorage.removeItem("sv:onboarding:coach");
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
        <Label htmlFor="profileHeadline">{t("headline")}</Label>
        <Input id="profileHeadline" maxLength={160} placeholder={t("headlineHint")} {...register("profileHeadline")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("bio")}</Label>
        <Textarea id="bio" maxLength={2000} className="min-h-[100px]" {...register("bio")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialties">{t("specialties")}</Label>
        <Input id="specialties" placeholder={t("specialtiesHint")} {...register("specialties")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="coachingType">{t("coachingType")}</Label>
          <select id="coachingType" className={selectClass} {...register("coachingType")}>
            <option value="">{t("selectPlaceholder")}</option>
            {COACHING_TYPES.map((c) => (
              <option key={c} value={c}>{t(`coachingTypeOpt.${c}`)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yearsOfExperience">{t("years")}</Label>
          <Input id="yearsOfExperience" type="number" min={0} max={60} {...register("yearsOfExperience")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sessionRateUSD">{t("rate")}</Label>
        <Input id="sessionRateUSD" type="number" min={0} step="1" {...register("sessionRateUSD")} />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" className="h-4 w-4" {...register("acceptingClients")} />
        {t("acceptingClients")}
      </label>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("saving") : t("cta")}
      </Button>
    </form>
  );
}
