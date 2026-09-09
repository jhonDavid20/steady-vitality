"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface Nudge { kind: "renewal" | "review"; clientPackageId: string; coachId: string }

export function RetentionNudges() {
  const t = useTranslations("Marketplace");
  const locale = useLocale();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  useEffect(() => { void fetch("/api/marketplace/retention/nudges", { cache: "no-store" }).then(async (response) => { if (response.ok) setNudges((await response.json()).data); }); }, []);
  if (nudges.length === 0) return null;
  return <div className="space-y-3">{nudges.map((nudge) => <aside className="rounded-xl border border-primary/30 bg-primary/5 p-4" key={`${nudge.kind}-${nudge.clientPackageId}`}><p className="text-sm">{t(nudge.kind === "renewal" ? "renewal" : "reviewNudge")}</p><Link className="mt-2 inline-block text-sm font-medium underline" href={nudge.kind === "renewal" ? `/${locale}/coach/${nudge.coachId}` : `/${locale}/review/${nudge.clientPackageId}`}>{nudge.kind === "renewal" ? t("packages") : t("leaveReview")}</Link></aside>)}</div>;
}
