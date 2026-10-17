import type { ReactNode } from "react";
import { Pagination } from "@/components/ui";
import type { StaffMember } from "@/lib/staff-members/api";
import { StaffMemberCard } from "./staff-member-card";

type Props = { currentUserId?: number; renderActions?: (member: StaffMember) => ReactNode; members: StaffMember[]; total: number; page: number; pageCount: number; onPageChange: (page: number) => void };

export function StaffMembersList({ members, total, page, pageCount, onPageChange, renderActions, currentUserId }: Props) {
  return <section aria-label="Lista de profesionales" className="space-y-3">
    <p aria-live="polite" className="text-sm text-on-surface-variant">{total} {total === 1 ? "profesional" : "profesionales"}</p>
    {members.map(member => <StaffMemberCard key={member.id} member={member} isCurrentUser={currentUserId !== undefined && member.userId === currentUserId} actions={renderActions?.(member)} />)}
    <Pagination label="Paginación de profesionales" page={page} pageCount={pageCount} onPageChange={onPageChange} />
  </section>;
}
