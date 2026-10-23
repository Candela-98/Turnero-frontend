import { getStaffMembers } from "@/lib/staff-members/api";
import type { AgendaFilters } from "./api";
export const appointmentKeys = {
  day: (businessId: number | undefined, timezone: string | undefined, date: string, filters: AgendaFilters) => ["appointments", businessId, timezone, date, filters] as const,
  staff: (businessId: number | undefined) => ["staff-members", businessId, "agenda"] as const,
  business: (businessId: number | undefined) => ["agenda-business", businessId] as const,
};
/** Reuse the complete catalog, including inactive staff. Search is local after all pages load. */
export async function getAgendaStaff(signal?: AbortSignal) {
  const members = [];
  for (let page = 0; ; page++) {
    signal?.throwIfAborted();
    const result = await getStaffMembers({ q: "", status: "ALL", page, size: 100 }, signal);
    if (result.page.number !== page || (result.data.length === 0 && page + 1 < result.page.total_pages)) throw new Error("Paginación de profesionales inconsistente");
    members.push(...result.data);
    if (page + 1 >= result.page.total_pages) return members;
  }
}
