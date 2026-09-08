"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const t = useTranslations("Access");
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const email = new FormData(event.currentTarget).get("email");
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    setMessage(data.message ?? t("requestError"));
    setLoading(false);
  }

  return <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">{t("email")}</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>{message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}<Button className="w-full" disabled={loading}>{loading ? t("sending") : t("sendReset")}</Button></form>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("Access");
  const locale = useLocale();
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newPassword = new FormData(event.currentTarget).get("password");
    setLoading(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) router.replace(`/${locale}/login`);
    else setMessage(data.message ?? t("resetError"));
    setLoading(false);
  }

  return <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="password">{t("newPassword")}</Label><Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" /></div>{message && <p className="text-sm text-destructive" role="alert">{message}</p>}<Button className="w-full" disabled={loading}>{loading ? t("saving") : t("savePassword")}</Button></form>;
}

export function VerifyEmailButton({ token }: { token: string }) {
  const t = useTranslations("Access");
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);
  async function verify() {
    setLoading(true);
    const response = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const data = await response.json().catch(() => ({}));
    setMessage(data.message ?? t("verifyError"));
    setLoading(false);
  }
  return <div className="space-y-3"><Button className="w-full" onClick={verify} disabled={loading}>{loading ? t("verifying") : t("verify")}</Button>{message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}</div>;
}
