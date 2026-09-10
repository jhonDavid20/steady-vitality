import { getServerUser } from "@/lib/auth";
import { DailyToday } from "@/components/daily/daily-today";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user, t] = await Promise.all([params, getServerUser(), getTranslations("Daily")]);
  if (user?.role !== "client") redirect(`/${locale}/today`);
  return <section className="space-y-6"><div><h1 className="text-3xl font-bold">{t("planTitle")}</h1><p className="text-muted-foreground">{t("planDescription")}</p></div><DailyToday /></section>;
}
