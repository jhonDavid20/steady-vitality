"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ReviewForm({ clientPackageId }: { clientPackageId: string }) {
  const t = useTranslations("Marketplace");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/marketplace/retention/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientPackageId, rating, text: text || null, anonymous }) });
    setMessage(response.ok ? t("reviewSaved") : t("saveError"));
  }
  return <form className="max-w-xl space-y-5 rounded-xl border p-6" onSubmit={(event) => void submit(event)}><label className="block"><span className="mb-1 block font-medium">{t("rating")}</span><select className="w-full rounded-md border bg-background p-2" value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label><label className="block"><span className="mb-1 block font-medium">{t("reviewText")}</span><textarea className="min-h-32 w-full rounded-md border bg-background p-2" maxLength={3000} value={text} onChange={(event) => setText(event.target.value)} /></label><label className="flex items-center gap-2 text-sm"><input checked={anonymous} type="checkbox" onChange={(event) => setAnonymous(event.target.checked)} />{t("anonymous")}</label><Button type="submit">{t("submitReview")}</Button>{message && <p className="text-sm" role="status">{message}</p>}</form>;
}
