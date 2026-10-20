import { apiFetch } from "@/lib/api/client";

export type CustomerStatus = "ACTIVE" | "INACTIVE";
export type CustomerSummaryDto = {
  id: number;
  name: string;
  email?: string | null;
  phone_number?: string | null;
  status: CustomerStatus;
  public_booking_blocked?: boolean;
};
export type CustomerSummary = {
  id: number;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  status: CustomerStatus;
  publicBookingBlocked: boolean;
};
export type CustomerDetailDto = CustomerSummaryDto & { internal_notes?: string | null; public_booking_block_reason?: string | null };
export type CustomerDetail = CustomerSummary & { internalNotes: string | null; publicBookingBlockReason: string | null };
export type CustomerWriteRequest = { name: string; phone_number: string; email: string; internal_notes: string };

export function toCustomerDetail(dto: CustomerDetailDto): CustomerDetail {
  return { ...toCustomerSummary(dto), internalNotes: dto.internal_notes?.trim() || null, publicBookingBlockReason: dto.public_booking_block_reason?.trim() || null };
}
export async function getCustomer(id: number, signal?: AbortSignal) {
  return toCustomerDetail(await apiFetch<CustomerDetailDto>(`/api/v1/customers/${id}`, { signal }));
}
export async function createCustomer(body: CustomerWriteRequest) {
  return toCustomerDetail(await apiFetch<CustomerDetailDto>("/api/v1/customers", { method: "POST", body }));
}
export async function updateCustomer(id: number, body: Partial<CustomerWriteRequest>) {
  return toCustomerDetail(await apiFetch<CustomerDetailDto>(`/api/v1/customers/${id}`, { method: "PATCH", body }));
}
export type CustomerFilters = { q: string; status: "ALL" | CustomerStatus; page: number; size: number; publicBookingBlocked?: boolean };
export type CustomerPageDto = {
  data: CustomerSummaryDto[];
  page: { number: number; size: number; total_elements: number; total_pages: number };
};
export const CUSTOMER_PAGE_SIZE = 20;
export const CUSTOMER_SORT = "name,asc";

export function toCustomerSummary(dto: CustomerSummaryDto): CustomerSummary {
  return { id: dto.id, name: dto.name, email: dto.email?.trim() || null,
    phoneNumber: dto.phone_number?.trim() || null, status: dto.status, publicBookingBlocked: dto.public_booking_blocked === true };
}
export function customerParams(filters: CustomerFilters) {
  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size), sort: CUSTOMER_SORT });
  if (filters.q.trim()) params.set("q", filters.q.trim());
  params.set("status", filters.status);
  if (filters.publicBookingBlocked !== undefined) params.set("public_booking_blocked", String(filters.publicBookingBlocked));
  return params.toString();
}
export async function getCustomers(filters: CustomerFilters, signal?: AbortSignal) {
  const result = await apiFetch<CustomerPageDto>("/api/v1/customers?" + customerParams(filters), { signal });
  return { data: result.data.map(toCustomerSummary), page: { number: result.page.number, size: result.page.size,
    totalElements: result.page.total_elements, totalPages: result.page.total_pages } };
}
