import { PublicCoachProfile } from "@/components/marketplace/coach-profile";

export default async function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicCoachProfile coachId={id} />;
}
