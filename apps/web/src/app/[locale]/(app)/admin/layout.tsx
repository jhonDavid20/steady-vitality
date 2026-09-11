import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerUser } from "@/lib/auth";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const [{ locale }, user, t] = await Promise.all([params, getServerUser(), getTranslations("Admin")]);
  if (user?.role !== "admin") redirect(`/${locale}/today`);

  return <section className="space-y-6">
    <div>
      <p className="text-sm font-medium text-primary">Steady Vitality</p>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
    </div>
    <AdminNavigation locale={locale} />
    {children}
  </section>;
}
