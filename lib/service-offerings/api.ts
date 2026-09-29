import { apiFetch } from "@/lib/api/client";

export type ServiceOfferingDto = {
  id: number;
  name: string;
  category: string | null;
  duration_minutes: number;
  price_cents: number;
  status: "ACTIVE" | "INACTIVE";
};

export type ServiceOffering = {
  id: number;
  name: string;
  category: string | null;
  durationMinutes: number;
  priceCents: number;
  status: "ACTIVE" | "INACTIVE";
};

export type ServiceFilters = {
  q: string;
  category: string;
  status: "ALL" | "ACTIVE" | "INACTIVE";
  page: number;
  size: number;
};

type PageDto = {
  data: ServiceOfferingDto[];
  page: { number: number; size: number; total_elements: number; total_pages: number };
};

export function toServiceOffering(dto: ServiceOfferingDto): ServiceOffering {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    durationMinutes: dto.duration_minutes,
    priceCents: dto.price_cents,
    status: dto.status,
  };
}

export function serviceOfferingParams(filters: ServiceFilters) {
  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size), sort: "name,asc" });
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.status !== "ALL") params.set("status", filters.status);
  return params.toString();
}

export async function getServiceOfferings(filters: ServiceFilters, signal?: AbortSignal) {
  const result = await apiFetch<PageDto>(`/api/v1/service-offerings?${serviceOfferingParams(filters)}`, { signal });
  return { data: result.data.map(toServiceOffering), page: result.page };
}

export function getServiceCategories(signal?: AbortSignal) {
  return apiFetch<string[]>("/api/v1/service-offerings/categories", { signal });
}
