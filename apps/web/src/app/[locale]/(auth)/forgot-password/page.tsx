import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/access-recovery-forms";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("Access");
  return <section className="space-y-6"><div><h1 className="text-2xl font-bold">{t("forgotTitle")}</h1><p className="text-sm text-muted-foreground">{t("forgotSubtitle")}</p></div><ForgotPasswordForm /></section>;
}
