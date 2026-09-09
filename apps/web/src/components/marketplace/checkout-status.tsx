"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function CheckoutStatus({ attemptId }: { attemptId?: string }) {
  const t = useTranslations("Marketplace");
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!attemptId) { setError(true); return; }
    let stopped = false;
    async function poll() {
      const response = await fetch(`/api/marketplace/commerce/checkout/${attemptId}`, { cache: "no-store" });
      if (!response.ok) { setError(true); return; }
      const next = (await response.json()).data.status as string;
      if (!stopped) setStatus(next);
      if (!stopped && next === "pending") window.setTimeout(() => void poll(), 2000);
    }
    void poll(); return () => { stopped = true; };
  }, [attemptId]);
  return <section className="mx-auto max-w-xl rounded-xl border p-8 text-center"><h1 className="text-3xl font-bold">{error ? t("checkoutError") : t(`payment.${status}`)}</h1><p className="mt-3 text-muted-foreground">{t(`paymentBody.${error ? "error" : status}`)}</p></section>;
}
