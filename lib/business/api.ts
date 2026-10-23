import { apiFetch } from "@/lib/api/client";

import type { BusinessApiResponse, BusinessUpdateRequest } from "./types";

export function getBusiness(signal?: AbortSignal) {
  return apiFetch<BusinessApiResponse>("/api/v1/business", { signal });
}

export function updateBusiness(request: BusinessUpdateRequest) {
  return apiFetch<BusinessApiResponse>("/api/v1/business", {
    body: request,
    method: "PATCH",
  });
}
