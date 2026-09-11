import { OperationsDashboard } from "@/components/operations/operations-dashboard";
import { getTranslations } from "next-intl/server";

export default async function AdminPage() {
  const t = await getTranslations("Admin");
  return <section className="space-y-2"><div><h2 className="text-2xl font-semibold tracking-tight">{t("overviewTitle")}</h2><p className="text-muted-foreground">{t("overviewDescription")}</p></div><div className="pt-4"><OperationsDashboard /></div></section>;
}
