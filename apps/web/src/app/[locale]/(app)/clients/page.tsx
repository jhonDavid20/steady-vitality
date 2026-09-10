import { getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CoachClients } from "@/components/coach/coach-clients";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, user] = await Promise.all([params, getServerUser()]);
  if (user?.role !== "coach") redirect(`/${locale}/today`);
  return <CoachClients locale={locale} />;
}
