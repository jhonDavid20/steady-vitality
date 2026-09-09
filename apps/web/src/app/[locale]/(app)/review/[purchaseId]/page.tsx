import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerUser } from "@/lib/auth";
import { ReviewForm } from "@/components/marketplace/review-form";

export default async function ReviewPage({ params }: { params: Promise<{ locale: string; purchaseId: string }> }) {
  const [{ locale, purchaseId }, user, t] = await Promise.all([params, getServerUser(), getTranslations("Marketplace")]);
  if (user?.role !== "client") redirect(`/${locale}/today`);
  return <section className="space-y-5"><h1 className="text-3xl font-bold">{t("leaveReview")}</h1><ReviewForm clientPackageId={purchaseId} /></section>;
}
