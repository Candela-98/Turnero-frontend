import { CUSTOMER_SORT, type CustomerFilters } from "./api";

export const customerKeys = {
  all: (businessId: number | undefined) => ["customers", businessId] as const,
  list: (businessId: number | undefined, filters: CustomerFilters) =>
    ["customers", businessId, { ...filters, q: filters.q.trim(), sort: CUSTOMER_SORT }] as const,
};
