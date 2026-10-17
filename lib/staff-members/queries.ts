import type { StaffFilters } from "./api";

export const staffMemberKeys = {
  list: (businessId: number | undefined, filters: StaffFilters) => ["staff-members", businessId, filters] as const,
};
