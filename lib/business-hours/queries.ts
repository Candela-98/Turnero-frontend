import type { QueryClient } from "@tanstack/react-query";
import { getBusinessHours } from "./api";
import { businessWeek, toBusinessHoursFormValues, validateBusinessHoursFormValues, type BusinessHoursDayFormValues, type BusinessHoursListApiResponse } from "./types";

export const businessHoursKeys = { agendaWeek: (businessId: number | undefined) => ["business-hours", businessId, "agenda-week"] as const };
export function toAgendaWeek(response: BusinessHoursListApiResponse) {
  const values = toBusinessHoursFormValues(response);
  const validation = validateBusinessHoursFormValues(values);
  if (validation.form || Object.keys(validation.days).length || values.days.some(day => !day.isClosed &&
    (!/^([01]\d|2[0-3]):[0-5]\d$/.test(day.opensAt) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.closesAt)))) throw new Error("Horarios del negocio no válidos");
  return values.days;
}
export async function getAgendaBusinessWeek(signal?: AbortSignal) { return toAgendaWeek(await getBusinessHours(signal)); }
export function agendaDayHours(week: BusinessHoursDayFormValues[], date: string) {
  const weekday = businessWeek[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7];
  const hours = week.find(day => day.dayOfWeek === weekday);
  if (!hours) throw new Error("Faltan los horarios del día seleccionado");
  return hours;
}
export async function applyBusinessHours(client: QueryClient, businessId: number, response: BusinessHoursListApiResponse) {
  const week = toAgendaWeek(response); const key = businessHoursKeys.agendaWeek(businessId);
  await client.cancelQueries({ queryKey: key, exact: true }); client.setQueryData(key, week);
}
