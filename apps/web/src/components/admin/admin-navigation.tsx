"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/admin", label: "overview" },
  { href: "/admin/users", label: "users" },
  { href: "/admin/invitations", label: "invitations" },
  { href: "/admin/leads", label: "leads" },
  { href: "/operations", label: "operations" },
  { href: "/admin/reviews", label: "reviews", unavailable: true },
  { href: "/admin/settings", label: "settings" },
] as const;

export function AdminNavigation({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations("Admin");

  return <nav aria-label={t("navigationLabel")} className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-2">
    {sections.map((section) => {
      const href = `/${locale}${section.href}`;
      const active = pathname === href;
      const className = cn("whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground");
      if ("unavailable" in section && section.unavailable) return <span aria-disabled="true" className="cursor-not-allowed whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/70" key={section.href}>{t(`navigation.${section.label}`)}<span className="ml-1.5 text-xs">{t("comingSoon")}</span></span>;
      return <Link className={className} href={href} key={section.href}>{t(`navigation.${section.label}`)}</Link>;
    })}
  </nav>;
}
