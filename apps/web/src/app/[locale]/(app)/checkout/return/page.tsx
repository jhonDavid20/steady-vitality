import { CheckoutStatus } from "@/components/marketplace/checkout-status";

export default async function CheckoutReturnPage({ searchParams }: { searchParams: Promise<{ attempt?: string }> }) {
  return <CheckoutStatus attemptId={(await searchParams).attempt} />;
}
