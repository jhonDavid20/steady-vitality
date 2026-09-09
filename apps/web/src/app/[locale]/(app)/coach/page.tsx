import { getServerUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { CoachDirectory } from "@/components/marketplace/coach-directory";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [, user, t] = await Promise.all([params, getServerUser(), getTranslations("Marketplace")]);
  if (!user) return null;
  return <section className="space-y-6"><h1 className="text-3xl font-bold">{t("findCoach")}</h1><CoachDirectory /></section>;
}
