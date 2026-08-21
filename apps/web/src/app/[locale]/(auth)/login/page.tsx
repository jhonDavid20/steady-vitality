import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function LoginPage({
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
          <h1 className="text-2xl font-bold text-foreground">{t("loginTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        </div>
        <LoginForm />
        <p className="text-sm text-center text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href={`/${locale}/register`} className="text-foreground font-medium underline underline-offset-4">
            {t("registerCta")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
