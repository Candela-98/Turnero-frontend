import { apiFetch } from "@/lib/api/client";

import type { BusinessHoursListApiResponse, BusinessHoursReplaceRequest } from "./types";

export function getBusinessHours() {
  return apiFetch<BusinessHoursListApiResponse>("/api/v1/business-hours");
}

export function replaceBusinessHours(request: BusinessHoursReplaceRequest) {
  return apiFetch<BusinessHoursListApiResponse>("/api/v1/business-hours", {
    body: request,
    method: "PUT",
  });
}
