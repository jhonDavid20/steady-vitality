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
  if (!user.hasCompletedOnboarding) redirect(`/${locale}/onboarding`);

  const [t, navigation] = await Promise.all([getTranslations("AppNav"), getTranslations("Navigation")]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-foreground">Steady Vitality</span>
          <div className="hidden md:block"><AppNavigation locale={locale} user={user} labels={{ Today: navigation("today"), Plan: navigation("plan"), Coach: navigation("coach"), Profile: navigation("profile"), Overview: navigation("overview"), Clients: navigation("clients"), Packages: navigation("packages"), Messages: navigation("messages"), Operations: navigation("operations") }} /></div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.firstName} · {t(`role.${user.role}`)}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
