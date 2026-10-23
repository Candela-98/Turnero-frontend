import type { QueryClient } from "@tanstack/react-query";
import { getBookingSettings } from "./api";
import { toSlotIntervalMinutes, type BookingSettingsApiResponse } from "./types";

export const bookingSettingsKeys = {
  agendaInterval: (businessId: number | undefined) => ["booking-settings", businessId, "agenda-interval"] as const,
};
export async function getAgendaInterval(signal?: AbortSignal) {
  const settings = await getBookingSettings(signal);
  return toSlotIntervalMinutes(settings.slot_interval_minutes);
}
/** Cancel older reads before publishing the interval confirmed by the server. */
export async function applyBookingSettings(client: QueryClient, businessId: number, settings: BookingSettingsApiResponse) {
  const interval = toSlotIntervalMinutes(settings.slot_interval_minutes);
  const key = bookingSettingsKeys.agendaInterval(businessId);
  await client.cancelQueries({ queryKey: key, exact: true });
  client.setQueryData(key, interval);
}
