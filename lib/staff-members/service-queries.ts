import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { ServiceFilters, ServiceOffering } from "@/lib/service-offerings/api";
import { serviceOfferingKeys } from "@/lib/service-offerings/queries";
import { selectedServiceIds } from "./services";
import type { getStaffMembers, StaffMember } from "./api";
import { staffMemberKeys } from "./queries";

export const staffServiceKeys = {
  selection: (businessId: number, staffId: number) => ["staff-services", businessId, staffId] as const,
  catalog: (businessId: number, filters: ServiceFilters) => [...serviceOfferingKeys.list(businessId), filters] as const,
};
function affectedKeys(businessId: number, staffId: number, serviceIds: readonly number[]): QueryKey[] {
  return [staffServiceKeys.selection(businessId, staffId), staffMemberKeys.all(businessId),
    staffMemberKeys.detail(businessId, staffId), serviceOfferingKeys.list(businessId),
    ...[...new Set(serviceIds)].map(id => serviceOfferingKeys.detail(businessId, id))];
}
export async function applyStaffServices(client: QueryClient, businessId: number, staffId: number, selection: ServiceOffering[], affectedIds: number[]) {
  await Promise.all(affectedKeys(businessId, staffId, affectedIds).map(queryKey => client.cancelQueries({ queryKey })));
  client.setQueryData(staffServiceKeys.selection(businessId, staffId), selection);
  const serviceCount = selectedServiceIds(selection).length;
  client.setQueriesData<Awaited<ReturnType<typeof getStaffMembers>>>({ queryKey: staffMemberKeys.all(businessId) }, cached =>
    cached?.data ? { ...cached, data: cached.data.map(member => member.id === staffId ? { ...member, serviceCount } : member) } : cached);
  client.setQueryData<StaffMember>(staffMemberKeys.detail(businessId, staffId), member => member ? { ...member, serviceCount } : member);
}
export async function refreshStaffServices(client: QueryClient, businessId: number, staffId: number, affectedIds: number[]) {
  await Promise.all(affectedKeys(businessId, staffId, affectedIds).map(queryKey =>
    client.invalidateQueries({ queryKey, ...(queryKey[0] === "staff-services" ? { refetchType: "all" as const } : {}) }, { throwOnError: true })));
}
