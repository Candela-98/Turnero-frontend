import { Suspense } from "react";
import { StaffMemberDetailPage } from "@/components/staff-members/staff-member-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><StaffMemberDetailPage rawId={id} /></Suspense>;
}
