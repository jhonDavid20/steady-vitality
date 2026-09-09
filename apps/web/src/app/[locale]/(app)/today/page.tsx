import { getTranslations } from "next-intl/server";
import { getServerUser } from "@/lib/auth";
import { DailyToday } from "@/components/daily/daily-today";
import { RetentionNudges } from "@/components/marketplace/retention-nudges";

export default async function TodayPage() {
  const user = await getServerUser();
  const t = await getTranslations("Today");

  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold text-foreground">
        {t("greeting", { name: user?.firstName ?? "" })}
      </h1>
      <p className="text-muted-foreground">{t("placeholder")}</p>
      {user?.role === "client" && <RetentionNudges />}
      {user?.role === "client" && <DailyToday />}
    </section>
  );
}
