"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Package { id: string; name: string; description?: string; durationWeeks: number; sessionsIncluded: number; priceUSD: number; features?: string[] }
interface Coach { firstName: string; lastName: string; profileHeadline?: string; bio?: string; specialties: string[]; yearsOfExperience?: number; coachingType?: string; packages: Package[] }
interface Review { id: string; rating: number; text?: string | null; anonymous: boolean; createdAt: string }

export function PublicCoachProfile({ coachId }: { coachId: string }) {
  const t = useTranslations("Marketplace");
  const locale = useLocale() as "en" | "es";
  const [coach, setCoach] = useState<Coach>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { void Promise.all([fetch(`/api/marketplace/coaches/${coachId}`), fetch(`/api/marketplace/retention/reviews/coach/${coachId}`)]).then(async ([profile, reviewResponse]) => { if (profile.ok) setCoach((await profile.json()).data); else setError(t("loadError")); if (reviewResponse.ok) setReviews((await reviewResponse.json()).data); }); }, [coachId, t]);

  async function checkout(packageId: string) {
    setError("");
    const response = await fetch("/api/marketplace/commerce/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId, locale }) });
    const result = await response.json();
    if (!response.ok) { setError(result.message ?? t("checkoutError")); return; }
    window.location.assign(result.data.checkoutUrl);
  }

  if (error && !coach) return <p className="text-destructive">{error}</p>;
  if (!coach) return <p className="text-muted-foreground">{t("loading")}</p>;
  return <div className="space-y-8"><header><h1 className="text-3xl font-bold">{coach.firstName} {coach.lastName}</h1><p className="text-lg text-muted-foreground">{coach.profileHeadline}</p><p className="mt-4 max-w-2xl">{coach.bio}</p><p className="mt-3 text-sm">{coach.specialties.join(" · ")}</p></header><section><h2 className="mb-4 text-2xl font-semibold">{t("packages")}</h2><div className="grid gap-5 md:grid-cols-2">{coach.packages.map((offer) => <article className="rounded-xl border p-5" key={offer.id}><h3 className="text-xl font-semibold">{offer.name}</h3><p className="text-muted-foreground">{offer.description}</p><p className="mt-3 font-medium">${Number(offer.priceUSD).toFixed(2)} USD · {t("weeks", { count: offer.durationWeeks })}</p><p className="text-sm">{t("sessions", { count: offer.sessionsIncluded })}</p><ul className="my-4 list-inside list-disc text-sm">{offer.features?.map((feature) => <li key={feature}>{feature}</li>)}</ul><Button onClick={() => void checkout(offer.id)}>{t("buy")}</Button></article>)}</div></section><section><h2 className="mb-4 text-2xl font-semibold">{t("reviews")}</h2>{reviews.length === 0 ? <p className="text-muted-foreground">{t("noReviews")}</p> : <div className="space-y-3">{reviews.map((review) => <article className="rounded-xl border p-4" key={review.id}><p aria-label={`${review.rating} out of 5`} className="font-medium">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>{review.text && <p className="mt-2">{review.text}</p>}<p className="mt-2 text-xs text-muted-foreground">{review.anonymous ? t("anonymous") : t("verifiedClient")}</p></article>)}</div>}</section>{error && <p className="text-destructive" role="alert">{error}</p>}</div>;
}
