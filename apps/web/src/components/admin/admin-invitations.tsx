"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Invite = { id: string; email: string; used: boolean; expiresAt: string; createdAt: string; invitedBy?: { email: string; firstName: string; lastName: string } };
type InviteResponse = { data: Invite[]; total: number };

function inviteState(invite: Invite): "used" | "expired" | "pending" {
  if (invite.used) return "used";
  return new Date(invite.expiresAt) < new Date() ? "expired" : "pending";
}

export function AdminInvitations() {
  const t = useTranslations("Admin");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revoking, setRevoking] = useState<Invite>();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/marketplace/invites?limit=100");
      if (!response.ok) throw new Error("load invites");
      setInvites((await response.json() as InviteResponse).data);
    } catch { setError(t("inviteLoadError")); } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/marketplace/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "create invite");
      setCreateOpen(false); setEmail(""); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("inviteCreateError")); } finally { setSubmitting(false); }
  }

  async function revokeInvite() {
    if (!revoking) return;
    setSubmitting(true); setError("");
    try {
      const response = await fetch(`/api/marketplace/invites/${revoking.id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "revoke invite");
      setRevoking(undefined); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("inviteRevokeError")); } finally { setSubmitting(false); }
  }

  return <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight">{t("invitationsTitle")}</h2><p className="text-muted-foreground">{t("invitationsDescription")}</p></div><Button onClick={() => setCreateOpen(true)}>{t("newInvitation")}</Button></div>
    {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error} <Button className="ml-2" onClick={() => void load()} size="sm" variant="outline">{t("retry")}</Button></div> : null}
    {loading ? <div className="space-y-3" aria-label={t("loading")}><div className="h-14 animate-pulse rounded-lg bg-muted" /><div className="h-14 animate-pulse rounded-lg bg-muted" /></div> : null}
    {!loading && !error && invites.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center"><h3 className="font-medium">{t("emptyInvitationsTitle")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("emptyInvitationsDescription")}</p></div> : null}
    {!loading && invites.length > 0 ? <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("invitedEmail")}</th><th className="px-4 py-3 font-medium">{t("createdBy")}</th><th className="px-4 py-3 font-medium">{t("inviteStatus")}</th><th className="px-4 py-3 font-medium">{t("expires")}</th><th className="px-4 py-3 font-medium"><span className="sr-only">{t("actions")}</span></th></tr></thead><tbody>{invites.map((invite) => { const state = inviteState(invite); return <tr className="border-b last:border-0" key={invite.id}><td className="px-4 py-4 font-medium">{invite.email}</td><td className="px-4 py-4 text-muted-foreground">{invite.invitedBy?.email ?? "—"}</td><td className="px-4 py-4"><span className={state === "pending" ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800" : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"}>{t(`inviteStates.${state}`)}</span></td><td className="px-4 py-4 text-muted-foreground">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(invite.expiresAt))}</td><td className="px-4 py-4 text-right">{state === "pending" ? <Button onClick={() => setRevoking(invite)} size="sm" variant="outline">{t("revoke")}</Button> : null}</td></tr>; })}</tbody></table></div> : null}
    <Dialog onOpenChange={setCreateOpen} open={createOpen}><DialogContent><form onSubmit={(event) => void createInvite(event)}><DialogHeader><DialogTitle>{t("newInvitation")}</DialogTitle><DialogDescription>{t("newInvitationDescription")}</DialogDescription></DialogHeader><Input className="mt-5" onChange={(event) => setEmail(event.target.value)} placeholder={t("invitedEmail")} required type="email" value={email} /><DialogFooter className="mt-5"><Button onClick={() => setCreateOpen(false)} type="button" variant="outline">{t("cancel")}</Button><Button disabled={submitting} type="submit">{submitting ? t("saving") : t("sendInvitation")}</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog onOpenChange={(open) => { if (!open) setRevoking(undefined); }} open={Boolean(revoking)}><DialogContent><DialogHeader><DialogTitle>{t("revokeInvitationTitle")}</DialogTitle><DialogDescription>{t("revokeInvitationDescription", { email: revoking?.email ?? "" })}</DialogDescription></DialogHeader><DialogFooter><Button disabled={submitting} onClick={() => setRevoking(undefined)} variant="outline">{t("cancel")}</Button><Button disabled={submitting} onClick={() => void revokeInvite()} variant="destructive">{submitting ? t("saving") : t("revoke")}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
