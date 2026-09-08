import { getServerUser } from "@/lib/auth";
import { RoleEmptyState } from "@/components/role-empty-state";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user] = await Promise.all([params, getServerUser()]);
  if (!user) return null;
  return <RoleEmptyState user={user} locale={locale} allowed={["client", "coach", "admin"]} title="Your profile" body="Profile controls and account security will appear here." />;
}
