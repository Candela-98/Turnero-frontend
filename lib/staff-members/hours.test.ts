import { afterEach, expect, it, vi } from "vitest";
import { weekDays } from "@/lib/weekly-hours";
import { getStaffHours, replaceStaffHours, sameStaffHours, staffHoursHints, staffHoursKey, toStaffHours, toStaffHoursRequest, validateStaffHours, type StaffHoursDto } from "./hours";
const dto: StaffHoursDto[] = weekDays.map(day => ({ day_of_week: day, is_available: day !== "SUNDAY", starts_at: day === "SUNDAY" ? null : "09:00", ends_at: day === "SUNDAY" ? null : "18:00" }));
afterEach(() => vi.unstubAllGlobals());
it("hydrates an unordered full week independently of response order", () => {
  expect(toStaffHours([...dto].reverse()).map(day => day.dayOfWeek)).toEqual(weekDays);
  expect(toStaffHours(dto)[6]).toMatchObject({ isAvailable: false, startsAt: "", endsAt: "" });
});
it("rejects missing, duplicate, invalid days and malformed active ranges", () => {
  for (const result of [dto.slice(0, 6), [...dto.slice(0, 6), dto[0]], [{ ...dto[0], day_of_week: "INVALID" }, ...dto.slice(1)]]) expect(() => toStaffHours(result as StaffHoursDto[])).toThrow();
  for (const value of ["", "25:00", "09:70", "09:00:30", "9:00"]) {
    const days = toStaffHours(dto); days[0].startsAt = value;
    expect(validateStaffHours(days).days.MONDAY?.start).toBeTruthy();
    expect(() => toStaffHoursRequest(days)).toThrow();
  }
  const days = toStaffHours(dto); days[0].startsAt = "18:00";
  expect(validateStaffHours(days).days.MONDAY?.end).toBeTruthy();
});
it("compares normalized days, ignores hidden hours and preserves all-off weeks", () => {
  const initial = toStaffHours(dto), current = toStaffHours(dto);
  current[6].startsAt = "12:00"; current[6].endsAt = "13:00";
  expect(sameStaffHours(current.reverse(), initial)).toBe(true);
  expect(toStaffHoursRequest(current)[6]).toEqual(dto[6]);
  current.forEach(day => { day.isAvailable = false; });
  expect(toStaffHoursRequest(current)).toHaveLength(7);
  expect(toStaffHoursRequest(current).every(day => day.starts_at === null && day.ends_at === null)).toBe(true);
});
it("uses the proxy, a full raw array, cancellation and isolated keys", async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json(dto)); vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  expect(await getStaffHours(5, signal)).toEqual(toStaffHours(dto));
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/staff-members/5/working-hours", expect.objectContaining({ signal, method: "GET", credentials: "include" }));
  await replaceStaffHours(5, toStaffHours(dto));
  expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: "PUT", body: JSON.stringify(dto) }));
  expect(staffHoursKey(1, 5)).not.toEqual(staffHoursKey(2, 5));
  expect(staffHoursKey(1, 5)).not.toEqual(staffHoursKey(1, 6));
});

const businessMonday = { dayOfWeek: "MONDAY" as const, isClosed: false, opensAt: "09:00", closesAt: "18:00" };
it("explains business limits only where a valid staff range exceeds them", () => {
  const day = toStaffHours(dto)[0];
  expect(staffHoursHints(day, businessMonday)).toEqual({});
  expect(staffHoursHints({ ...day, startsAt: "08:00", endsAt: "19:00" }, businessMonday)).toEqual({
    start: "El negocio abre a las 09:00; solo se podrán reservar turnos desde esa hora.",
    end: "El negocio cierra a las 18:00; solo se podrán reservar turnos hasta esa hora.",
  });
  expect(staffHoursHints({ ...day, endsAt: "19:00" }, businessMonday).start).toBeUndefined();
  expect(staffHoursHints({ ...day, startsAt: "08:00" }, businessMonday).end).toBeUndefined();
});
it("explains closed days and non-overlapping ranges without claiming availability", () => {
  const day = toStaffHours(dto)[0];
  expect(staffHoursHints(day, { ...businessMonday, isClosed: true }).day).toContain("El negocio está cerrado");
  for (const [startsAt, endsAt] of [["07:00", "09:00"], ["18:00", "20:00"]]) {
    expect(staffHoursHints({ ...day, startsAt, endsAt }, businessMonday).day).toContain("no se podrán reservar turnos en este rango");
  }
  expect(staffHoursHints({ ...day, isAvailable: false }, { ...businessMonday, isClosed: true })).toEqual({});
});
it("does not guess limits for unavailable business data or invalid time fields", () => {
  const day = toStaffHours(dto)[0];
  expect(staffHoursHints(day)).toEqual({});
  expect(staffHoursHints({ ...day, startsAt: "" }, businessMonday)).toEqual({});
  expect(staffHoursHints({ ...day, startsAt: "19:00" }, businessMonday)).toEqual({});
  expect(staffHoursHints(day, { ...businessMonday, closesAt: "25:00" })).toEqual({});
});
