import { Suspense } from "react";
import { StaffMembersPage } from "@/components/staff-members/staff-members-page";

export default function StaffMembers() {
  return <Suspense><StaffMembersPage /></Suspense>;
}
