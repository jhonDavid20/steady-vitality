import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ClientOnboardingForm } from "@/components/onboarding/client-onboarding-form";
import { CoachOnboardingForm } from "@/components/onboarding/coach-onboarding-form";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getServerUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.hasCompletedOnboarding) redirect(`/${locale}/today`);

  const t = await getTranslations("Onboarding");
  const isCoach = user.role === "coach";

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isCoach ? t("coachTitle") : t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCoach ? t("coachSubtitle") : t("subtitle")}
          </p>
        </div>
        <Card className="border-border">
          <CardContent className="p-6 sm:p-8">
            {isCoach ? <CoachOnboardingForm /> : <ClientOnboardingForm />}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
