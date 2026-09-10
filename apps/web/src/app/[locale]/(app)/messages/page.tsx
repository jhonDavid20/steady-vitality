import { getServerUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { CoachingChat } from "@/components/daily/coaching-chat";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [, user, t] = await Promise.all([params, getServerUser(), getTranslations("Messages")]);
  if (!user) return null;
  return <section className="space-y-6"><h1 className="text-3xl font-bold">{t("title")}</h1><CoachingChat locale={(await params).locale} userId={user.id} isCoach={user.role === "coach"} /></section>;
}
