import { afterEach, describe, expect, it, vi } from "vitest";
import { appointmentParams, getDayAppointments, toAppointment, type AppointmentDto } from "./api";
import { businessDate, shiftDay, validDate, clockTime } from "./dates";
import { getAgendaStaff, appointmentKeys } from "./queries";
const dto: AppointmentDto = { id: 1, customer_id: 2, staff_member_id: 3, service_offering_id: 4,
 starts_at: "2026-10-20T23:30:00-03:00", ends_at: "2026-10-21T00:30:00-03:00", duration_minutes: 60, price_cents: 1000,
 status: "PENDING", source: "ADMIN", customer_notes: null, internal_notes: "Interno", cancellation_reason: null,
 customer: { id: 2, available: true, name: "Cliente archivado", status: "INACTIVE" },
 staff_member: { id: 3, available: true, name: "Profesional eliminado", status: "INACTIVE" },
 service_offering: { id: 4, available: false, name: null, status: null } };
const filters = { staff: "3", status: "PENDING" as const };
afterEach(() => vi.unstubAllGlobals());
describe("appointments read contract", () => {
 it("adapts historical references and unavailable data without demo dependencies", () => {
  expect(toAppointment(dto)).toMatchObject({ customerName: "Cliente archivado", staffMemberName: "Profesional eliminado", serviceOfferingName: "Servicio no disponible", startsAt: dto.starts_at });
 });
 it("encodes only explicit filters and creates isolated keys", () => {
  expect(appointmentParams("2026-10-20", filters).get("staff_member_id")).toBe("3");
  expect(appointmentParams("2026-10-20", { staff: "", status: "ALL" }).has("status")).toBe(false);
  expect(appointmentKeys.day(1, "UTC", "2026-10-20", filters)).not.toEqual(appointmentKeys.day(2, "UTC", "2026-10-20", filters));
 });
 it("reads every day page and passes the same cancellation signal", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ data: [dto], page: { number: 0, total_elements: 2, total_pages: 2 } }))
   .mockResolvedValueOnce(Response.json({ data: [{ ...dto, id: 2 }], page: { number: 1, total_elements: 2, total_pages: 2 } })); vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  expect(await getDayAppointments("2026-10-20", filters, controller.signal)).toHaveLength(2);
  expect(fetch.mock.calls[1][0]).toContain("page=1"); expect(fetch.mock.calls[1][1].signal).toBe(controller.signal);
 });
 it("rejects an intermediate error instead of returning a partial day", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ data: [dto], page: { number: 0, total_elements: 2, total_pages: 2 } })).mockResolvedValueOnce(Response.json({}, { status: 503 })));
  await expect(getDayAppointments("2026-10-20", filters)).rejects.toMatchObject({ status: 503 });
 });
 it("rejects duplicated or missing rows after concurrent changes", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ data: [dto], page: { number: 0, total_elements: 2, total_pages: 2 } })).mockResolvedValueOnce(Response.json({ data: [dto], page: { number: 1, total_elements: 2, total_pages: 2 } })));
  await expect(getDayAppointments("2026-10-20", filters)).rejects.toThrow("La agenda cambió");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [dto], page: { number: 0, total_elements: 2, total_pages: 1 } })));
  await expect(getDayAppointments("2026-10-20", filters)).rejects.toThrow("No se pudo completar");
 });
 it("does not fetch after cancellation", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); const controller = new AbortController(); controller.abort();
  await expect(getDayAppointments("2026-10-20", filters, controller.signal)).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled();
 });
 it("reads the whole staff catalog without excluding inactive staff", async () => {
  const member = { id: 1, name: "Ana", status: "INACTIVE" };
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ data: [member], page: { number: 0, total_elements: 2, total_pages: 2 } })).mockResolvedValueOnce(Response.json({ data: [{ ...member, id: 101 }], page: { number: 1, total_elements: 2, total_pages: 2 } })); vi.stubGlobal("fetch", fetch);
  expect(await getAgendaStaff()).toHaveLength(2); expect(fetch.mock.calls[0][0]).not.toContain("status=");
 });
 it("uses business dates across midnight, month/year changes and DST", () => {
  expect(businessDate("America/Argentina/Buenos_Aires", new Date("2027-01-01T01:00:00Z"))).toBe("2026-12-31");
  expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01"); expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
  expect(clockTime("2026-03-08T07:30:00Z", "America/New_York")).toBe("03:30");
  expect(validDate("2026-02-30")).toBe(false);
 });
});
