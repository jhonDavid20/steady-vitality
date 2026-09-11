"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Role = "admin" | "coach" | "client";
type User = { id: string; email: string; username: string; firstName: string; lastName: string; role: Role; isActive: boolean; isEmailVerified: boolean; hasCompletedOnboarding: boolean; lastLoginAt: string | null; createdAt: string };
type UsersResponse = { data: User[]; total: number };
type PendingAction = { user: User; value: boolean };

const roleOptions: Role[] = ["admin", "coach", "client"];

export function AdminUsers() {
  const t = useTranslations("Admin");
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState<"all" | Role>("all");
  const [status, setStatus] = useState<"all" | "active" | "blocked">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState<PendingAction>();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const params = new URLSearchParams({ limit: "100" });
    if (role !== "all") params.set("role", role);
    if (status !== "all") params.set("isActive", String(status === "active"));
    try {
      const response = await fetch(`/api/marketplace/admin/users?${params}`);
      if (!response.ok) throw new Error("load users");
      const body = await response.json() as UsersResponse;
      setUsers(body.data); setTotal(body.total);
    } catch { setError(true); } finally { setLoading(false); }
  }, [role, status]);

  useEffect(() => { void load(); }, [load]);

  const visibleUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => `${user.firstName} ${user.lastName} ${user.email} ${user.username}`.toLowerCase().includes(needle));
  }, [query, users]);

  async function confirmAction() {
    if (!pending) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/marketplace/admin/users/${pending.user.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: pending.value }) });
      if (!response.ok) throw new Error("update user");
      setPending(undefined); await load();
    } catch { setError(true); } finally { setSaving(false); }
  }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight">{t("usersTitle")}</h2><p className="text-muted-foreground">{t("usersDescription")}</p></div><p className="text-sm text-muted-foreground">{t("userCount", { count: total })}</p></div>
    <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_11rem_11rem]"><Input aria-label={t("searchUsers")} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchUsers")} value={query} /><Select onValueChange={(value) => setRole(value as "all" | Role)} value={role}><SelectTrigger><SelectValue placeholder={t("role")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("allRoles")}</SelectItem>{roleOptions.map((option) => <SelectItem key={option} value={option}>{t(`roles.${option}`)}</SelectItem>)}</SelectContent></Select><Select onValueChange={(value) => setStatus(value as "all" | "active" | "blocked")} value={status}><SelectTrigger><SelectValue placeholder={t("status")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("allStatuses")}</SelectItem><SelectItem value="active">{t("active")}</SelectItem><SelectItem value="blocked">{t("blocked")}</SelectItem></SelectContent></Select></div>
    {loading ? <div className="space-y-3" aria-label={t("loading")}><div className="h-14 animate-pulse rounded-lg bg-muted" /><div className="h-14 animate-pulse rounded-lg bg-muted" /></div> : null}
    {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"><p className="font-medium">{t("loadError")}</p><Button className="mt-3" onClick={() => void load()} variant="outline">{t("retry")}</Button></div> : null}
    {!loading && !error && visibleUsers.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center"><h3 className="font-medium">{t("emptyUsersTitle")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("emptyUsersDescription")}</p></div> : null}
    {!loading && !error && visibleUsers.length > 0 ? <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("user")}</th><th className="px-4 py-3 font-medium">{t("role")}</th><th className="px-4 py-3 font-medium">{t("status")}</th><th className="px-4 py-3 font-medium">{t("lastAccess")}</th><th className="px-4 py-3 font-medium"><span className="sr-only">{t("actions")}</span></th></tr></thead><tbody>{visibleUsers.map((user) => <tr className="border-b last:border-0" key={user.id}><td className="px-4 py-4"><p className="font-medium">{user.firstName} {user.lastName}</p><p className="text-muted-foreground">{user.email}</p></td><td className="px-4 py-4"><span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{t(`roles.${user.role}`)}</span></td><td className="px-4 py-4"><span className={user.isActive ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800" : "rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"}>{user.isActive ? t("active") : t("blocked")}</span></td><td className="px-4 py-4 text-muted-foreground">{user.lastLoginAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(user.lastLoginAt)) : t("never")}</td><td className="px-4 py-4 text-right"><Button disabled={user.role === "admin"} onClick={() => setPending({ user, value: !user.isActive })} size="sm" variant={user.isActive ? "outline" : "default"}>{user.isActive ? t("block") : t("unblock")}</Button></td></tr>)}</tbody></table></div> : null}
    <Dialog onOpenChange={(open) => { if (!open) setPending(undefined); }} open={Boolean(pending)}><DialogContent><DialogHeader><DialogTitle>{pending?.value ? t("confirmUnblockTitle") : t("confirmBlockTitle")}</DialogTitle><DialogDescription>{t("confirmStatusDescription", { name: `${pending?.user.firstName ?? ""} ${pending?.user.lastName ?? ""}` })}</DialogDescription></DialogHeader><DialogFooter><Button disabled={saving} onClick={() => setPending(undefined)} variant="outline">{t("cancel")}</Button><Button disabled={saving} onClick={() => void confirmAction()} variant={pending?.value === false ? "destructive" : "default"}>{saving ? t("saving") : t("confirm")}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
