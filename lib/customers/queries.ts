import { CUSTOMER_SORT, type CustomerFilters } from "./api";
import type { QueryClient } from "@tanstack/react-query";
import type { CustomerDetail } from "./api";

export const customerKeys = {
  all: (businessId: number | undefined) => ["customers", businessId] as const,
  detail: (businessId: number | undefined, id: number | undefined) => ["customer", businessId, id] as const,
  list: (businessId: number | undefined, filters: CustomerFilters) =>
    ["customers", businessId, { ...filters, q: filters.q.trim(), sort: CUSTOMER_SORT }] as const,
};

export async function applyCustomerWrite(client: QueryClient, businessId: number, saved: CustomerDetail) {
  await Promise.all([
    client.cancelQueries({ queryKey: customerKeys.all(businessId) }),
    client.cancelQueries({ queryKey: customerKeys.detail(businessId, saved.id), exact: true }),
  ]);
  client.setQueryData(customerKeys.detail(businessId, saved.id), saved);
}

export async function refreshCustomers(client: QueryClient, businessId: number, id: number) {
  await Promise.all([
    client.invalidateQueries({ queryKey: customerKeys.all(businessId) }, { throwOnError: true }),
    client.invalidateQueries({ queryKey: customerKeys.detail(businessId, id), exact: true }, { throwOnError: true }),
  ]);
}
