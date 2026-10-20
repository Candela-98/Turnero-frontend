import { CUSTOMER_PAGE_SIZE, type CustomerFilters } from "./api";

type Params = { get: (key: string) => string | null };
export function customerListContext(params: Params): CustomerFilters {
  const q = params.get("q")?.trim() ?? "";
  const status = params.get("status");
  const rawPage = params.get("page") ?? "0";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : NaN;
  return { q: q.length <= 100 ? q : "", status: status === "ACTIVE" || status === "INACTIVE" || status === "ALL" ? status : "ACTIVE",
    publicBookingBlocked: params.get("public_booking_blocked") === "true" ? true : params.get("public_booking_blocked") === "false" ? false : undefined,
    page: Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0, size: CUSTOMER_PAGE_SIZE };
}
export function customerContextSearch(filters: CustomerFilters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.status !== "ACTIVE") params.set("status", filters.status);
  if (filters.publicBookingBlocked !== undefined) params.set("public_booking_blocked", String(filters.publicBookingBlocked));
  if (filters.page > 0) params.set("page", String(filters.page));
  return params.size ? "?" + params : "";
}

export function customerIdFromPath(raw: string): number | null {
  const id = /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
