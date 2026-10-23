import { apiFetch } from "@/lib/api/client";

import type { BookingSettingsApiResponse, BookingSettingsUpdateRequest } from "./types";

export function getBookingSettings(signal?: AbortSignal) {
  return apiFetch<BookingSettingsApiResponse>("/api/v1/booking-settings", { signal });
}

export function updateBookingSettings(request: BookingSettingsUpdateRequest) {
  return apiFetch<BookingSettingsApiResponse>("/api/v1/booking-settings", {
    body: request,
    method: "PATCH",
  });
}
