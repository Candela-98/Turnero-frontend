import { apiFetch } from "@/lib/api/client";

export type CustomerStatus = "ACTIVE" | "INACTIVE";
export type CustomerSummaryDto = {
  id: number;
  name: string;
  email?: string | null;
  phone_number?: string | null;
  status: CustomerStatus;
};
export type CustomerSummary = {
  id: number;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  status: CustomerStatus;
};
export type CustomerFilters = { q: string; status: "ALL" | CustomerStatus; page: number; size: number };
export type CustomerPageDto = {
  data: CustomerSummaryDto[];
  page: { number: number; size: number; total_elements: number; total_pages: number };
};
export const CUSTOMER_PAGE_SIZE = 20;
export const CUSTOMER_SORT = "name,asc";

export function toCustomerSummary(dto: CustomerSummaryDto): CustomerSummary {
  return { id: dto.id, name: dto.name, email: dto.email?.trim() || null,
    phoneNumber: dto.phone_number?.trim() || null, status: dto.status };
}
export function customerParams(filters: CustomerFilters) {
  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size), sort: CUSTOMER_SORT });
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.status !== "ALL") params.set("status", filters.status);
  return params.toString();
}
export async function getCustomers(filters: CustomerFilters, signal?: AbortSignal) {
  const result = await apiFetch<CustomerPageDto>("/api/v1/customers?" + customerParams(filters), { signal });
  return { data: result.data.map(toCustomerSummary), page: { number: result.page.number, size: result.page.size,
    totalElements: result.page.total_elements, totalPages: result.page.total_pages } };
}
