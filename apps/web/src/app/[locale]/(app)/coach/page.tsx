import { getServerUser } from "@/lib/auth";
import { RoleEmptyState } from "@/components/role-empty-state";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user] = await Promise.all([params, getServerUser()]);
  if (!user) return null;
  return <RoleEmptyState user={user} locale={locale} allowed={["client"]} title="Your coach" body="When you are connected, you will find your coach and their packages here." />;
}
