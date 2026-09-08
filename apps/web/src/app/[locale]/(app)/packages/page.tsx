import { getServerUser } from "@/lib/auth";
import { RoleEmptyState } from "@/components/role-empty-state";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user] = await Promise.all([params, getServerUser()]);
  if (!user) return null;
  return <RoleEmptyState user={user} locale={locale} allowed={["coach"]} title="Packages" body="Create offers and manage the packages assigned to your clients." />;
}
