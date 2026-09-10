"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { AuthUser } from "@steady/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileEditor({ user }: { user: AuthUser }) {
  const t = useTranslations("Profile");
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [timezone, setTimezone] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/marketplace/users/me").then(async (response) => { if (!response.ok) return; const data = await response.json(); setFirstName(data.user?.firstName ?? data.data?.firstName ?? user.firstName); setLastName(data.user?.lastName ?? data.data?.lastName ?? user.lastName); setTimezone(data.user?.timezone ?? data.data?.timezone ?? ""); }); }, [user.firstName, user.lastName]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(""); const response = await fetch("/api/marketplace/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, timezone: timezone || undefined }) }); setMessage(response.ok ? t("saved") : t("saveError")); }
  return <section className="space-y-6"><div><h1 className="text-3xl font-bold">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div><form className="max-w-xl space-y-4 rounded-xl border p-5" onSubmit={(event) => void submit(event)}><div className="grid gap-4 sm:grid-cols-2"><label><Label htmlFor="firstName">{t("firstName")}</Label><Input id="firstName" required value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label><Label htmlFor="lastName">{t("lastName")}</Label><Input id="lastName" required value={lastName} onChange={(event) => setLastName(event.target.value)} /></label></div><label><Label htmlFor="timezone">{t("timezone")}</Label><Input id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label><p className="text-sm text-muted-foreground">{user.email}</p><Button type="submit">{t("save")}</Button>{message && <p className="text-sm" role="status">{message}</p>}</form></section>;
}
