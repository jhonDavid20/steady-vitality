import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getServerUser();
  if (user) redirect(`/${locale}/today`);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
