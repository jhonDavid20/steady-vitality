import Link from "next/link";
import type { AuthUser } from "@steady/shared";

const links: Record<AuthUser["role"], Array<{ href: string; label: string }>> = {
  client: [
    { href: "/today", label: "Today" }, { href: "/plan", label: "Plan" }, { href: "/coach", label: "Coach" }, { href: "/messages", label: "Messages" }, { href: "/profile", label: "Profile" },
  ],
  coach: [
    { href: "/today", label: "Overview" }, { href: "/clients", label: "Clients" }, { href: "/plans", label: "Plan" }, { href: "/packages", label: "Packages" }, { href: "/messages", label: "Messages" }, { href: "/profile", label: "Profile" },
  ],
  admin: [{ href: "/operations", label: "Operations" }, { href: "/profile", label: "Profile" }],
};

export function AppNavigation({ locale, user, labels }: { locale: string; user: AuthUser; labels: Record<string, string> }) {
  return <nav className="flex gap-3 overflow-x-auto text-sm" aria-label="Primary navigation">
    {links[user.role].map((link) => <Link className="whitespace-nowrap text-muted-foreground hover:text-foreground" href={`/${locale}${link.href}`} key={link.href}>{labels[link.label]}</Link>)}
  </nav>;
}
