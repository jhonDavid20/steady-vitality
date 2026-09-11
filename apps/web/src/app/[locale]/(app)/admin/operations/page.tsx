import { OperationsDashboard } from "@/components/operations/operations-dashboard";
import { getTranslations } from "next-intl/server";

export default async function AdminOperationsPage() {
  const t = await getTranslations("Admin");

  return <section className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{t("operationsTitle")}</h2>
      <p className="text-muted-foreground">{t("operationsDescription")}</p>
    </div>
    <OperationsDashboard mode="operations" />
  </section>;
}
