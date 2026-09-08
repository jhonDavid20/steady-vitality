import { redirect } from "next/navigation";
import type { AuthUser } from "@steady/shared";

export function RoleEmptyState({ user, locale, allowed, title, body }: { user: AuthUser; locale: string; allowed: AuthUser["role"][]; title: string; body: string }) {
  if (!allowed.includes(user.role)) redirect(`/${locale}/today`);
  return <section className="space-y-3"><h1 className="text-3xl font-bold">{title}</h1><p className="max-w-xl text-muted-foreground">{body}</p></section>;
}
