import { Suspense } from "react";
import { CustomerDetailPage } from "@/components/customers/customer-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><CustomerDetailPage key={id} rawId={id} /></Suspense>;
}
