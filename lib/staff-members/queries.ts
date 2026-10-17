import type { QueryClient } from "@tanstack/react-query";
import type { StaffFilters } from "./api";

export const staffMemberKeys = {
  userLink: (businessId: number | undefined, userId?: number) => userId === undefined ? ["staff-link", businessId] as const : ["staff-link", businessId, userId] as const,
  all: (businessId: number | undefined) => ["staff-members", businessId] as const,
  detail: (businessId: number | undefined, id: number | undefined) => ["staff-member", businessId, id] as const,
  list: (businessId: number | undefined, filters: StaffFilters) => ["staff-members", businessId, filters] as const,
};

export async function refreshStaffMembers(client: QueryClient, businessId: number, id?: number) {
  await Promise.all([
    client.invalidateQueries({ queryKey: staffMemberKeys.userLink(businessId) }, { throwOnError: true }),
    client.invalidateQueries({ queryKey: staffMemberKeys.all(businessId) }, { throwOnError: true }),
    ...(id === undefined ? [] : [client.invalidateQueries({ queryKey: staffMemberKeys.detail(businessId, id), exact: true }, { throwOnError: true })]),
  ]);
}
