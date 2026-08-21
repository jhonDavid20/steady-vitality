"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const t = useTranslations("AppNav");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace(`/${locale}/login`);
      router.refresh();
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={loading}>
      {t("logout")}
    </Button>
  );
}
