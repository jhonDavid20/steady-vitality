"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Review = { id: string; rating: number; text: string | null; anonymous: boolean; visible: boolean; createdAt: string; clientName: string | null; coachName: string | null };
type ReviewResponse = { data: Review[] };

export function AdminReviews() {
  const t = useTranslations("Admin");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [visible, setVisible] = useState<"all" | "true" | "false">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState<Review>();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => { setLoading(true); setError(false); const query = visible === "all" ? "" : `?visible=${visible}`; try { const response = await fetch(`/api/marketplace/admin/reviews${query}`); if (!response.ok) throw new Error("load reviews"); setReviews((await response.json() as ReviewResponse).data); } catch { setError(true); } finally { setLoading(false); } }, [visible]);
  useEffect(() => { void load(); }, [load]);
  async function moderate() { if (!pending) return; setSaving(true); try { const response = await fetch(`/api/marketplace/admin/reviews/${pending.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visible: !pending.visible }) }); if (!response.ok) throw new Error("update review"); setPending(undefined); await load(); } catch { setError(true); } finally { setSaving(false); } }

  return <section className="space-y-5"><div><h2 className="text-2xl font-semibold tracking-tight">{t("reviewsTitle")}</h2><p className="text-muted-foreground">{t("reviewsDescription")}</p></div><div className="max-w-52"><Select onValueChange={(value) => setVisible(value as "all" | "true" | "false")} value={visible}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("allReviews")}</SelectItem><SelectItem value="true">{t("published")}</SelectItem><SelectItem value="false">{t("hidden")}</SelectItem></SelectContent></Select></div>
    {loading ? <div className="space-y-3" aria-label={t("loading")}><div className="h-20 animate-pulse rounded-lg bg-muted" /><div className="h-20 animate-pulse rounded-lg bg-muted" /></div> : null}
    {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"><p className="font-medium">{t("reviewLoadError")}</p><Button className="mt-3" onClick={() => void load()} variant="outline">{t("retry")}</Button></div> : null}
    {!loading && !error && reviews.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center"><h3 className="font-medium">{t("emptyReviewsTitle")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("emptyReviewsDescription")}</p></div> : null}
    {!loading && !error && reviews.length > 0 ? <div className="space-y-3">{reviews.map((review) => <article className="rounded-xl border bg-card p-5" key={review.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-medium">{review.anonymous ? t("anonymousClient") : review.clientName ?? t("unknownClient")} <span className="text-muted-foreground">→ {review.coachName ?? t("unknownCoach")}</span></p><p className="mt-1 text-sm text-muted-foreground">{t("rating", { count: review.rating })} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(review.createdAt))}</p></div><div className="flex items-center gap-3"><span className={review.visible ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800" : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"}>{review.visible ? t("published") : t("hidden")}</span><Button onClick={() => setPending(review)} size="sm" variant="outline">{review.visible ? t("hideReview") : t("publishReview")}</Button></div></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{review.text || t("noReviewText")}</p></article>)}</div> : null}
    <Dialog onOpenChange={(open) => { if (!open) setPending(undefined); }} open={Boolean(pending)}><DialogContent><DialogHeader><DialogTitle>{pending?.visible ? t("hideReviewTitle") : t("publishReviewTitle")}</DialogTitle><DialogDescription>{pending?.visible ? t("hideReviewDescription") : t("publishReviewDescription")}</DialogDescription></DialogHeader><DialogFooter><Button disabled={saving} onClick={() => setPending(undefined)} variant="outline">{t("cancel")}</Button><Button disabled={saving} onClick={() => void moderate()} variant={pending?.visible ? "destructive" : "default"}>{saving ? t("saving") : t("confirm")}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
