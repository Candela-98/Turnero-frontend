import type { StaffFilters } from "./api";

type Params = { get: (key: string) => string | null };
export function staffListContext(params: Params): StaffFilters {
  const q = params.get("q")?.trim() ?? "", status = params.get("status"), rawPage = params.get("page") ?? "0";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : NaN;
  return { q: q.length <= 100 ? q : "", status: status === "ACTIVE" || status === "INACTIVE" ? status : "ALL",
    page: Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0, size: 20 };
}
export function staffContextSearch(filters: StaffFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (filters.page > 0) params.set("page", String(filters.page));
  return params.size ? `?${params}` : "";
}
export function staffIdFromPath(raw: string): number | null {
  const id = /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
