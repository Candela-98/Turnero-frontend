import type { ReactNode } from "react";
import { StaffRemovalFeedbackProvider } from "@/components/staff-members/staff-removal-feedback";
export default function Layout({ children }: { children: ReactNode }) {
  return <StaffRemovalFeedbackProvider>{children}</StaffRemovalFeedbackProvider>;
}
