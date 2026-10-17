import { Pagination } from "@/components/ui";
import type { StaffMember } from "@/lib/staff-members/api";
import { StaffMemberCard } from "./staff-member-card";

type Props = { members: StaffMember[]; total: number; page: number; pageCount: number; onPageChange: (page: number) => void };

export function StaffMembersList({ members, total, page, pageCount, onPageChange }: Props) {
  return <section aria-label="Lista de profesionales" className="space-y-3">
    <p aria-live="polite" className="text-sm text-on-surface-variant">{total} {total === 1 ? "profesional" : "profesionales"}</p>
    {members.map(member => <StaffMemberCard key={member.id} member={member} />)}
    <Pagination label="Paginación de profesionales" page={page} pageCount={pageCount} onPageChange={onPageChange} />
  </section>;
}
