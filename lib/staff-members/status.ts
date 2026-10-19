import type { QueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api/client";
import { toStaffMember, type StaffMemberDto, type StaffMember, type StaffFilters, type getStaffMembers } from "./api";
import { staffMemberKeys } from "./queries";

export async function changeStaffStatus(member: StaffMember): Promise<StaffMember> {
  if (member.status === "ACTIVE") {
    await apiFetch<void>(`/api/v1/staff-members/${member.id}`, { method: "DELETE" });
    return { ...member, status: "INACTIVE" };
  }
  const dto = await apiFetch<StaffMemberDto>(`/api/v1/staff-members/${member.id}`, { method: "PATCH", body: { status: "ACTIVE" } });
  // A successful response confirms the requested state even if its representation needs a fresh GET.
  if (!dto || dto.id !== member.id || dto.status !== "ACTIVE" || typeof dto.name !== "string") return { ...member, status: "ACTIVE" };
  return { ...toStaffMember(dto), serviceCount: member.serviceCount };
}
export function staffStatusError(error: unknown) {
  if (error instanceof ApiError && error.status === 409 && (error.code === "STAFF_HAS_FUTURE_APPOINTMENTS" || error.code === "CONFLICT")) {
    return "Tiene turnos futuros pendientes o confirmados. Cancelalos o reasignalos antes de desactivarlo.";
  }
  return "No pudimos cambiar el estado del profesional. Intentá nuevamente.";
}
export async function applyStaffStatus(client: QueryClient, businessId: number, confirmed: StaffMember) {
  await Promise.all([
    client.cancelQueries({ queryKey: staffMemberKeys.all(businessId) }),
    client.cancelQueries({ queryKey: staffMemberKeys.detail(businessId, confirmed.id), exact: true }),
    client.cancelQueries({ queryKey: staffMemberKeys.userLink(businessId) }),
  ]);
  client.setQueryData(staffMemberKeys.detail(businessId, confirmed.id), confirmed);
  client.setQueriesData<StaffMember | null>({ queryKey: staffMemberKeys.userLink(businessId) }, member => member?.id === confirmed.id ? { ...member, status: confirmed.status } : member);
  for (const [key, data] of client.getQueriesData<Awaited<ReturnType<typeof getStaffMembers>>>({ queryKey: staffMemberKeys.all(businessId) })) {
    if (!data?.data.some(member => member.id === confirmed.id)) continue;
    const status = (key[2] as StaffFilters).status;
    const remove = status !== "ALL" && status !== confirmed.status;
    const total = remove ? Math.max(0, data.page.total_elements - 1) : data.page.total_elements;
    client.setQueryData(key, { data: remove ? data.data.filter(member => member.id !== confirmed.id)
      : data.data.map(member => member.id === confirmed.id ? { ...member, status: confirmed.status } : member),
      page: { ...data.page, total_elements: total, total_pages: Math.ceil(total / data.page.size) } });
  }
}

export function removeStaffMember(id: number) {
  return apiFetch<void>(`/api/v1/staff-members/${id}/catalog`, { method: "DELETE" });
}
export async function applyStaffRemoval(client: QueryClient, businessId: number, id: number) {
  await Promise.all([
    client.cancelQueries({ queryKey: staffMemberKeys.all(businessId) }),
    client.cancelQueries({ queryKey: staffMemberKeys.detail(businessId, id), exact: true }),
    client.cancelQueries({ queryKey: staffMemberKeys.userLink(businessId) }),
    client.cancelQueries({ queryKey: ["staff-services", businessId, id] }),
    client.cancelQueries({ queryKey: ["staff-working-hours", businessId, id] }),
  ]);
  client.removeQueries({ queryKey: staffMemberKeys.detail(businessId, id), exact: true });
  client.removeQueries({ queryKey: ["staff-services", businessId, id], exact: true });
  client.removeQueries({ queryKey: ["staff-working-hours", businessId, id], exact: true });
  client.setQueriesData<StaffMember | null>({ queryKey: staffMemberKeys.userLink(businessId) }, member => member?.id === id ? null : member);
  for (const [key, data] of client.getQueriesData<Awaited<ReturnType<typeof getStaffMembers>>>({ queryKey: staffMemberKeys.all(businessId) })) {
    if (!data?.data.some(member => member.id === id)) continue;
    const total = Math.max(0, data.page.total_elements - 1);
    client.setQueryData(key, { data: data.data.filter(member => member.id !== id), page: { ...data.page, total_elements: total, total_pages: Math.ceil(total / data.page.size) } });
  }
}
