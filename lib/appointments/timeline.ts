import type { BusinessHoursDayFormValues } from "@/lib/business-hours/types";
import { toSlotIntervalMinutes, type SlotIntervalMinutes } from "@/lib/booking-settings/types";
import type { Appointment } from "./api";
import { businessDate, businessDayStart, businessLocalTime, clockTime } from "./dates";

export const MINUTE_HEIGHT = 4;
export type PositionedAppointment = { appointment: Appointment; start: number; end: number; lane: number; lanes: number };
export function professionalCondition(a: Appointment) {
  if (!a.staffMemberAvailable) return "No disponible";
  if (a.staffMemberDeletedAt) return "Eliminado";
  return a.staffMemberStatus === "INACTIVE" ? "Inactivo" : null;
}
/** Assign collision lanes per connected group; adjoining appointments reuse the same lane. */
export function positionAppointments(appointments: Appointment[], midnight: number): PositionedAppointment[] {
  const ordered = [...appointments].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt) || a.id - b.id);
  const result: PositionedAppointment[] = [];
  let group: PositionedAppointment[] = []; let ends: number[] = []; let groupEnd = -Infinity;
  const finish = () => { for (const item of group) item.lanes = ends.length; result.push(...group); group = []; ends = []; };
  for (const appointment of ordered) {
    const start = (Date.parse(appointment.startsAt) - midnight) / 60000;
    const end = Math.max(start + 1, (Date.parse(appointment.endsAt) - midnight) / 60000);
    if (start >= groupEnd && group.length) finish();
    let lane = ends.findIndex(value => value <= start);
    if (lane < 0) lane = ends.length;
    ends[lane] = end;
    group.push({ appointment, start, end, lane, lanes: 1 }); groupEnd = Math.max(groupEnd, end);
  }
  finish(); return result;
}
export function buildTimeline(appointments: Appointment[], timezone: string, date: string, now: number | null, slotIntervalMinutes: SlotIntervalMinutes, businessHours: BusinessHoursDayFormValues) {
  const interval = toSlotIntervalMinutes(slotIntervalMinutes);
  const midnight = businessDayStart(date, timezone);
  const ordered = [...appointments].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt) || a.id - b.id);
  const professionals = [...new Map(ordered.map(a => [a.staffMemberId, a])).values()]
    .sort((a, b) => a.staffMemberName.localeCompare(b.staffMemberName, "es", { sensitivity: "base", numeric: true }) || a.staffMemberId - b.staffMemberId)
    .map(a => {
      const items = positionAppointments(ordered.filter(item => item.staffMemberId === a.staffMemberId), midnight);
      return { id: a.staffMemberId, name: a.staffMemberName, condition: professionalCondition(a), items, width: Math.max(300, ...items.map(item => item.lanes * 260)) };
    });
  const current = now !== null && businessDate(timezone, new Date(now)) === date ? (now - midnight) / 60000 : null;
  const starts = ordered.map(a => (Date.parse(a.startsAt) - midnight) / 60000);
  const ends = ordered.map(a => (Date.parse(a.endsAt) - midnight) / 60000);
  const opens = businessHours.isClosed ? null : (businessLocalTime(date, businessHours.opensAt, timezone) - midnight) / 60000;
  const closes = businessHours.isClosed ? null : (businessLocalTime(date, businessHours.closesAt, timezone) - midnight) / 60000;
  const start = Math.floor(Math.min(...starts, ...(opens === null ? [] : [opens - interval]), ...(current === null ? [] : [current])) / interval) * interval;
  const end = Math.max(start + interval, Math.ceil(Math.max(...ends, ...(closes === null ? [] : [closes + interval]), ...(current === null ? [] : [current + 1])) / interval) * interval);
  const ticks = Array.from({ length: (end - start) / interval + 1 }, (_, index) => {
    const minute = start + index * interval; const instant = new Date(midnight + minute * 60000);
    return { minute, label: clockTime(instant.toISOString(), timezone), date: businessDate(timezone, instant), instant };
  });
  const outsideHours = (opens === null || closes === null ? [{ start, end }] : [
    { start, end: Math.min(end, opens) }, { start: Math.max(start, closes), end },
  ]).filter(band => band.end > band.start);
  return { professionals, ordered, current, midnight, start, end, ticks, outsideHours, opens };
}
