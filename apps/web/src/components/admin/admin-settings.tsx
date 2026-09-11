"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AdminSettings() {
  const t = useTranslations("Admin");
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<number>();
  const [error, setError] = useState(false);

  async function cleanSessions() {
    setRunning(true); setError(false);
    try {
      const response = await fetch("/api/marketplace/admin/cleanup/sessions", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("cleanup sessions");
      setResult(body.result?.total ?? 0); setConfirming(false);
    } catch { setError(true); } finally { setRunning(false); }
  }

  return <section className="space-y-5"><div><h2 className="text-2xl font-semibold tracking-tight">{t("settingsTitle")}</h2><p className="text-muted-foreground">{t("settingsDescription")}</p></div>
    {result !== undefined ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{t("cleanupSuccess", { count: result })}</div> : null}
    {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{t("cleanupError")}</div> : null}
    <div className="max-w-2xl rounded-xl border bg-card p-6"><h3 className="font-semibold">{t("cleanupTitle")}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("cleanupDescription")}</p><Button className="mt-5" onClick={() => setConfirming(true)} variant="outline">{t("cleanupAction")}</Button></div>
    <div className="max-w-2xl rounded-xl border bg-card p-6"><div className="flex items-center gap-2"><h3 className="font-semibold">{t("exportsTitle")}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t("requiresBackend")}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("exportsDescription")}</p><Button className="mt-5" disabled variant="outline">{t("exportCsv")}</Button></div>
    <Dialog onOpenChange={setConfirming} open={confirming}><DialogContent><DialogHeader><DialogTitle>{t("cleanupConfirmTitle")}</DialogTitle><DialogDescription>{t("cleanupConfirmDescription")}</DialogDescription></DialogHeader><DialogFooter><Button disabled={running} onClick={() => setConfirming(false)} variant="outline">{t("cancel")}</Button><Button disabled={running} onClick={() => void cleanSessions()}>{running ? t("saving") : t("cleanupAction")}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
