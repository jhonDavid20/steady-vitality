import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { OperationsDashboard } from "@/components/operations/operations-dashboard";

export default async function OperationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user] = await Promise.all([params, getServerUser()]);
  if (user?.role !== "admin") redirect(`/${locale}/today`);
  return <section className="space-y-6"><div><h1 className="text-3xl font-bold">Operations</h1><p className="text-muted-foreground">Recent purchases, payment states, and audit activity.</p></div><OperationsDashboard /></section>;
}
