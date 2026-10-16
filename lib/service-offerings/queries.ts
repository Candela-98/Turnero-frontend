import type { QueryClient } from "@tanstack/react-query";
import type { getServiceOfferings, ServiceFilters, ServiceOffering } from "./api";

export const serviceOfferingKeys = {
  list: (businessId: number | undefined) => ["service-offerings", businessId] as const,
  categories: (businessId: number | undefined) => ["service-offering-categories", businessId] as const,
  detail: (businessId: number | undefined, id: number | undefined) => ["service-offering", businessId, id] as const,
};

/** Reflect a confirmed write before refreshing, even if that refresh fails. */
export async function applyServiceStatus(client: QueryClient, businessId: number, service: ServiceOffering, status: ServiceOffering["status"]) {
  await Promise.all([
    client.cancelQueries({ queryKey: serviceOfferingKeys.list(businessId) }),
    client.cancelQueries({ queryKey: serviceOfferingKeys.detail(businessId, service.id), exact: true }),
  ]);
  client.setQueryData(serviceOfferingKeys.detail(businessId, service.id), { ...service, status });
  for (const [key, data] of client.getQueriesData<Awaited<ReturnType<typeof getServiceOfferings>>>({ queryKey: serviceOfferingKeys.list(businessId) })) {
    if (!data?.data.some(item => item.id === service.id)) continue;
    const filterStatus = (key[2] as ServiceFilters).status;
    const remove = filterStatus !== "ALL" && filterStatus !== status;
    const total = remove ? Math.max(0, data.page.total_elements - 1) : data.page.total_elements;
    client.setQueryData(key, {
      data: remove ? data.data.filter(item => item.id !== service.id) : data.data.map(item => item.id === service.id ? { ...item, status } : item),
      page: { ...data.page, total_elements: total, total_pages: Math.ceil(total / data.page.size) },
    });
  }
}

/** Remove only catalog cache entries; persisted history remains on the server. */
export async function applyServiceRemoval(client: QueryClient, businessId: number, id: number) {
  await Promise.all([
    client.cancelQueries({ queryKey: serviceOfferingKeys.list(businessId) }),
    client.cancelQueries({ queryKey: serviceOfferingKeys.detail(businessId, id), exact: true }),
  ]);
  client.removeQueries({ queryKey: serviceOfferingKeys.detail(businessId, id), exact: true });
  for (const [key, data] of client.getQueriesData<Awaited<ReturnType<typeof getServiceOfferings>>>({ queryKey: serviceOfferingKeys.list(businessId) })) {
    if (!data?.data.some(item => item.id === id)) continue;
    const total = Math.max(0, data.page.total_elements - 1);
    client.setQueryData(key, { data: data.data.filter(item => item.id !== id), page: { ...data.page, total_elements: total, total_pages: Math.ceil(total / data.page.size) } });
  }
}

export async function refreshServiceCatalog(client: QueryClient, businessId: number, id?: number) {
  await Promise.all([
    client.invalidateQueries({ queryKey: serviceOfferingKeys.list(businessId) }, { throwOnError: true }),
    client.invalidateQueries({ queryKey: serviceOfferingKeys.categories(businessId) }, { throwOnError: true }),
    ...(id === undefined ? [] : [client.invalidateQueries({ queryKey: serviceOfferingKeys.detail(businessId, id), exact: true }, { throwOnError: true })]),
  ]);
}
