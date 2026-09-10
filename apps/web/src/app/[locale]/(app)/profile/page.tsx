import { getServerUser } from "@/lib/auth";
import { ProfileEditor } from "@/components/profile/profile-editor";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const [, user] = await Promise.all([params, getServerUser()]);
  if (!user) return null;
  return <ProfileEditor user={user} />;
}
