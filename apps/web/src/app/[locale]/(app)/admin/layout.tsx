import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerUser } from "@/lib/auth";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const [{ locale }, user, t] = await Promise.all([params, getServerUser(), getTranslations("Admin")]);
  if (user?.role !== "admin") redirect(`/${locale}/today`);

  return <section className="admin-shell overflow-hidden">
    <div className="border-b border-border px-5 py-6 sm:px-8 sm:py-7">
      <p className="admin-kicker">Steady Vitality · {t("title")}</p>
      <h1 className="admin-page-title mt-2 text-3xl font-semibold text-foreground sm:text-4xl">{t("title")}</h1>
    </div>
    <div className="border-b border-border bg-muted/30 px-3 py-3 sm:px-5">
      <AdminNavigation locale={locale} />
    </div>
    <div className="p-5 sm:p-8">{children}</div>
  </section>;
}
