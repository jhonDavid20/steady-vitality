import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppNavigation } from "@/components/app-navigation";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getServerUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isEmailVerified) redirect(`/${locale}/verify-email`);
  if (!user.hasCompletedOnboarding) redirect(`/${locale}/onboarding`);

  const [t, navigation] = await Promise.all([getTranslations("AppNav"), getTranslations("Navigation")]);

  return (
    <div className={`min-h-screen bg-background ${user.role === "admin" ? "admin-app" : ""}`}>
      <header className="sticky top-0 z-40 border-b border-border">
        <div className={`mx-auto flex h-16 items-center justify-between px-4 ${user.role === "admin" ? "max-w-7xl" : "max-w-5xl"}`}>
          <span className="font-semibold tracking-tight text-foreground">Steady Vitality</span>
          <div className="hidden md:block"><AppNavigation locale={locale} user={user} labels={{ Today: navigation("today"), Plan: navigation("plan"), Coach: navigation("coach"), Profile: navigation("profile"), Overview: navigation("overview"), Clients: navigation("clients"), Packages: navigation("packages"), Messages: navigation("messages"), Operations: navigation("operations"), Admin: navigation("admin"), Users: navigation("users") }} /></div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.firstName} · {t(`role.${user.role}`)}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 py-8 sm:py-10 ${user.role === "admin" ? "max-w-7xl" : "max-w-5xl"}`}>{children}</main>
    </div>
  );
}
