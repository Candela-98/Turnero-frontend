import type { QueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { toCustomerDetail, type CustomerDetail, type CustomerDetailDto, type CustomerStatus, type CustomerSummary, type CustomerFilters, type getCustomers } from "./api";
import { customerKeys } from "./queries";

export type CustomerAction = "archive" | "restore" | "block" | "unblock";
export type CustomerStatusResult = { id: number; status?: CustomerStatus; publicBookingBlocked?: boolean; publicBookingBlockReason?: string | null; detail?: CustomerDetail };

export async function changeCustomerStatus(customer: CustomerSummary, action: CustomerAction = customer.status === "ACTIVE" ? "archive" : "restore", reason?: string): Promise<CustomerStatusResult> {
  if (action === "archive") {
    await apiFetch<void>(`/api/v1/customers/${customer.id}`, { method: "DELETE" });
    return { id: customer.id, status: "INACTIVE" };
  }
  const patch = action === "restore" ? { status: "ACTIVE" as const } : {
    publicBookingBlocked: action === "block", publicBookingBlockReason: action === "block" ? reason!.trim() : null,
  };
  const body = action === "restore" ? { status: "ACTIVE" } : {
    public_booking_blocked: action === "block", ...(action === "block" ? { public_booking_block_reason: reason!.trim() } : {}),
  };
  const dto = await apiFetch<CustomerDetailDto>(`/api/v1/customers/${customer.id}`, { method: "PATCH", body });
  let detail: CustomerDetail | undefined;
  // The write succeeded. Recover malformed representations with GET, never another PATCH.
  if (dto?.id === customer.id && (dto.status === "ACTIVE" || dto.status === "INACTIVE") && typeof dto.name === "string"
      && typeof dto.public_booking_blocked === "boolean"
      && (action !== "restore" || dto.status === "ACTIVE")
      && (action === "restore" || dto.public_booking_blocked === (action === "block"))
      && (!dto.public_booking_blocked || typeof dto.public_booking_block_reason === "string")) {
    try { detail = toCustomerDetail(dto); } catch { /* Refresh the representation. */ }
  }
  return { id: customer.id, ...patch, detail };
}

export async function applyCustomerStatus(client: QueryClient, businessId: number, confirmed: CustomerStatusResult) {
  await Promise.all([
    client.cancelQueries({ queryKey: customerKeys.all(businessId) }),
    client.cancelQueries({ queryKey: customerKeys.detail(businessId, confirmed.id), exact: true }),
  ]);
  const { detail, ...patch } = confirmed;
  client.setQueryData<CustomerDetail>(customerKeys.detail(businessId, confirmed.id), current =>
    detail ?? (current ? { ...current, ...patch } : undefined));
  for (const [key, data] of client.getQueriesData<Awaited<ReturnType<typeof getCustomers>>>({ queryKey: customerKeys.all(businessId) })) {
    if (!data || !Array.isArray(data.data) || !data.page || !data.data.some(customer => customer.id === confirmed.id)) continue;
    const filters = key[2] as CustomerFilters;
    const rows = data.data.map(customer => customer.id === confirmed.id ? {
      ...customer, ...(confirmed.status === undefined ? {} : { status: confirmed.status }),
      ...(confirmed.publicBookingBlocked === undefined ? {} : { publicBookingBlocked: confirmed.publicBookingBlocked }),
      ...(detail ? { status: detail.status, publicBookingBlocked: detail.publicBookingBlocked } : {}),
    } : customer).filter(customer =>
      (filters.status === "ALL" || customer.status === filters.status)
      && (filters.publicBookingBlocked === undefined || customer.publicBookingBlocked === filters.publicBookingBlocked));
    const total = Math.max(0, data.page.totalElements - (data.data.length - rows.length));
    client.setQueryData(key, { data: rows, page: { ...data.page, totalElements: total, totalPages: Math.ceil(total / data.page.size) } });
  }
}
