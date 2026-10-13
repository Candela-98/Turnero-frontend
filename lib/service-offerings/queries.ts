import type { QueryClient } from "@tanstack/react-query";

export const serviceOfferingKeys = {
  list: (businessId: number | undefined) => ["service-offerings", businessId] as const,
  categories: (businessId: number | undefined) => ["service-offering-categories", businessId] as const,
  detail: (businessId: number | undefined, id: number | undefined) => ["service-offering", businessId, id] as const,
};

export async function refreshServiceCatalog(client: QueryClient, businessId: number, id?: number) {
  await Promise.all([
    client.invalidateQueries({ queryKey: serviceOfferingKeys.list(businessId) }, { throwOnError: true }),
    client.invalidateQueries({ queryKey: serviceOfferingKeys.categories(businessId) }, { throwOnError: true }),
    ...(id === undefined ? [] : [client.invalidateQueries({ queryKey: serviceOfferingKeys.detail(businessId, id), exact: true }, { throwOnError: true })]),
  ]);
}
