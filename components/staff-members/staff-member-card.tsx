import { Avatar, Badge } from "@/components/ui";
import type { StaffMember } from "@/lib/staff-members/api";

export function StaffMemberCard({ member }: { member: StaffMember }) {
  const initials = member.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toLocaleUpperCase("es-AR");
  return <article className="flex items-start gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-soft sm:items-center sm:p-5">
    <Avatar key={member.avatarUrl} name={member.name} initials={initials} imageUrl={member.avatarUrl} size="lg" />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 break-words text-base font-semibold sm:text-lg">{member.name}</h2>
        <Badge tone={member.status === "ACTIVE" ? "positive" : "neutral"}>{member.status === "ACTIVE" ? "Activo" : "Inactivo"}</Badge>
      </div>
      {member.roleLabel ? <p className="mt-1 break-words text-sm text-on-surface-variant">{member.roleLabel}</p> : null}
      {member.specialty ? <p className="mt-1 break-words text-sm text-on-surface-variant">{member.specialty}</p> : null}
    </div>
  </article>;
}
