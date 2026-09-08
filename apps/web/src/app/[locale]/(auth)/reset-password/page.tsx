import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/access-recovery-forms";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const t = await getTranslations("Access");
  const { token } = await searchParams;
  if (!token) return <p className="text-sm text-destructive">{t("invalidLink")}</p>;
  return <section className="space-y-6"><div><h1 className="text-2xl font-bold">{t("resetTitle")}</h1><p className="text-sm text-muted-foreground">{t("resetSubtitle")}</p></div><ResetPasswordForm token={token} /></section>;
}
