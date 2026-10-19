import { apiFetch } from "@/lib/api/client";
import type { BusinessHoursDayFormValues } from "@/lib/business-hours";
import { weekDays, type WeekDay } from "@/lib/weekly-hours";

export type StaffHoursDto = { day_of_week: WeekDay; is_available: boolean; starts_at: string | null; ends_at: string | null };
export type StaffHoursDay = { dayOfWeek: WeekDay; isAvailable: boolean; startsAt: string; endsAt: string };
export type StaffHoursErrors = Partial<Record<WeekDay, { start?: string; end?: string }>>;
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function staffHoursHints(day: StaffHoursDay, business?: BusinessHoursDayFormValues): { start?: string; end?: string; day?: string } {
  if (!day.isAvailable || !business) return {};
  if (business.isClosed) return { day: "El negocio está cerrado este día; no se podrán reservar turnos aunque el profesional figure disponible." };
  if (![day.startsAt, day.endsAt, business.opensAt, business.closesAt].every(validTime)
    || day.startsAt >= day.endsAt || business.opensAt >= business.closesAt) return {};
  if (day.endsAt <= business.opensAt || day.startsAt >= business.closesAt) {
    return { day: `Este horario no coincide con el del negocio (${business.opensAt}–${business.closesAt}); no se podrán reservar turnos en este rango.` };
  }
  return {
    start: day.startsAt < business.opensAt ? `El negocio abre a las ${business.opensAt}; solo se podrán reservar turnos desde esa hora.` : undefined,
    end: day.endsAt > business.closesAt ? `El negocio cierra a las ${business.closesAt}; solo se podrán reservar turnos hasta esa hora.` : undefined,
  };
}
export function validateStaffHours(days: StaffHoursDay[]): { days: StaffHoursErrors; form?: string } {
  if (days.length !== 7 || new Set(days.map(day => day.dayOfWeek)).size !== 7 || days.some(day => !weekDays.includes(day.dayOfWeek))) {
    return { days: {}, form: "La semana debe incluir los siete días, sin repetir ninguno." };
  }
  const errors: StaffHoursErrors = {};
  for (const day of days) {
    if (!day.isAvailable) continue;
    const fields: { start?: string; end?: string } = {};
    if (!validTime(day.startsAt)) fields.start = "Ingresá una hora de inicio válida.";
    if (!validTime(day.endsAt)) fields.end = "Ingresá una hora de fin válida.";
    if (!fields.start && !fields.end && day.startsAt >= day.endsAt) fields.end = "La hora de fin debe ser posterior al inicio.";
    if (fields.start || fields.end) errors[day.dayOfWeek] = fields;
  }
  return { days: errors };
}
export function toStaffHoursRequest(days: StaffHoursDay[]): StaffHoursDto[] {
  const validation = validateStaffHours(days);
  if (validation.form || Object.keys(validation.days).length) throw new Error("Invalid staff week");
  const byDay = new Map(days.map(day => [day.dayOfWeek, day]));
  return weekDays.map(key => {
    const day = byDay.get(key)!;
    return { day_of_week: key, is_available: day.isAvailable, starts_at: day.isAvailable ? day.startsAt : null, ends_at: day.isAvailable ? day.endsAt : null };
  });
}
export function toStaffHours(dto: StaffHoursDto[]): StaffHoursDay[] {
  if (!Array.isArray(dto) || dto.some(day => !day || typeof day.is_available !== "boolean")) throw new Error("Invalid staff hours response");
  const days = dto.map(day => ({ dayOfWeek: day.day_of_week, isAvailable: day.is_available, startsAt: day.starts_at ?? "", endsAt: day.ends_at ?? "" }));
  const validation = validateStaffHours(days);
  if (validation.form || Object.keys(validation.days).length) throw new Error("Invalid staff hours response");
  return weekDays.map(key => days.find(day => day.dayOfWeek === key)!);
}
export function sameStaffHours(left: StaffHoursDay[], right: StaffHoursDay[]) {
  const normalized = (days: StaffHoursDay[]) => weekDays.map(key => {
    const day = days.find(item => item.dayOfWeek === key);
    return day ? [key, day.isAvailable, ...(day.isAvailable ? [day.startsAt, day.endsAt] : [])] : null;
  });
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}
export const staffHoursKey = (businessId: number, staffId: number) => ["staff-working-hours", businessId, staffId] as const;
export async function getStaffHours(id: number, signal?: AbortSignal) {
  return toStaffHours(await apiFetch<StaffHoursDto[]>(`/api/v1/staff-members/${id}/working-hours`, { signal }));
}
// The caller validates the confirmed response separately so an invalid 200 never repeats a write.
export function replaceStaffHours(id: number, days: StaffHoursDay[]) {
  return apiFetch<StaffHoursDto[]>(`/api/v1/staff-members/${id}/working-hours`, { method: "PUT", body: toStaffHoursRequest(days) });
}
