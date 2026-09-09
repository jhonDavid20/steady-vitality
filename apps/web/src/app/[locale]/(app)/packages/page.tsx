import { getServerUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { PackageManager } from "@/components/marketplace/package-manager";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user, t] = await Promise.all([params, getServerUser(), getTranslations("Marketplace")]);
  if (!user) return null;
  if (user.role !== "coach") redirect(`/${locale}/today`);
  return <section className="space-y-6"><h1 className="text-3xl font-bold">{t("managePackages")}</h1><PackageManager coachId={user.id} /></section>;
}
