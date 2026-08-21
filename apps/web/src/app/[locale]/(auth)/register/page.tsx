import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Auth");

  return (
    <Card className="border-border">
      <CardContent className="p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">{t("registerTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("registerSubtitle")}</p>
        </div>
        <RegisterForm />
        <p className="text-sm text-center text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href={`/${locale}/login`} className="text-foreground font-medium underline underline-offset-4">
            {t("loginCta")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
