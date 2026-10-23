import { describe, expect, it } from "vitest";
import { toAppointment, type AppointmentDto } from "./api";
import { businessDayStart, relativeDayLabel } from "./dates";
import { buildTimeline, positionAppointments, professionalCondition } from "./timeline";
const dto: AppointmentDto = {
  id: 1, customer_id: 1, staff_member_id: 1, service_offering_id: 1,
  starts_at: "2026-10-20T09:00:00-03:00", ends_at: "2026-10-20T09:30:00-03:00", duration_minutes: 30, price_cents: 5000,
  status: "CONFIRMED", source: "ADMIN", customer_notes: null, internal_notes: null, cancellation_reason: null,
  customer: { id: 1, available: true, name: "Ana", status: "ACTIVE" },
  staff_member: { id: 1, available: true, name: "Mateo", status: "ACTIVE", deleted_at: null },
  service_offering: { id: 1, available: true, name: "Corte", status: "ACTIVE" },
};
const closedDay = { dayOfWeek: "TUESDAY", isClosed: true, opensAt: "", closesAt: "" } as const;
const zone = "America/Argentina/Buenos_Aires";
const appointment = (id: number, start: string, end: string) => toAppointment({ ...dto, id, starts_at: `2026-10-20T${start}:00-03:00`, ends_at: `2026-10-20T${end}:00-03:00` });
describe("agenda temporal layout", () => {
 it("positions minutes proportionally and allows touching endpoints", () => {
  const model = positionAppointments([appointment(1,"09:00","09:30"), appointment(2,"09:30","10:30")], businessDayStart("2026-10-20",zone));
  expect(model.map(a => [a.start,a.end,a.lane,a.lanes])).toEqual([[540,570,0,1],[570,630,0,1]]);
 });
 it("keeps all overlaps in separate lanes, reusing lanes within a connected group", () => {
  const model = positionAppointments([appointment(1,"09:00","10:00"),appointment(2,"09:15","09:30"),appointment(3,"09:30","10:00"),appointment(4,"10:00","10:30")],businessDayStart("2026-10-20",zone));
  expect(model.map(a => [a.lane,a.lanes])).toEqual([[0,2],[1,2],[1,2],[0,1]]);
 });
 it("sorts columns by name independently of first appointment and distinguishes staff conditions", () => {
  const first = { ...appointment(1,"09:00","09:30"), staffMemberId: 2, staffMemberName: "Zoe" };
  const second = { ...appointment(2,"10:00","10:30"), staffMemberName: "Ana", staffMemberStatus: "INACTIVE" };
  const model=buildTimeline([first,second],zone,"2026-10-20",Date.parse("2026-10-21T12:00:00Z"),30,closedDay);
  expect(model.professionals.map(p => p.name)).toEqual(["Ana","Zoe"]); expect(model.current).toBeNull();
  expect(professionalCondition(second)).toBe("Inactivo");
  expect(professionalCondition({ ...second, staffMemberDeletedAt: "2026-10-19T12:00:00Z" })).toBe("Eliminado");
  expect(professionalCondition({ ...second, staffMemberAvailable: false })).toBe("No disponible");
 });
 it("marks the current business minute only on Today, extending the axis to include it", () => {
  const model=buildTimeline([appointment(1,"09:00","09:30")],zone,"2026-10-20",Date.parse("2026-10-20T19:45:00Z"),30,closedDay);
  expect(model.current).toBe(1005); expect(model.end).toBe(1020);
 });
 it.each([15,30,45,60] as const)("uses %i minute marks without snapping or resizing appointments", interval => {
  const a=appointment(1,"09:10","10:20"); const model=buildTimeline([a],zone,"2026-10-20",null,interval,closedDay);
  for(let i=1;i<model.ticks.length;i++) expect(model.ticks[i].minute-model.ticks[i-1].minute).toBe(interval);
  expect(model.professionals[0].items[0].start).toBe(550);
  expect(model.professionals[0].items[0].end).toBe(620);
  expect(model.start).toBeLessThanOrEqual(550);expect(model.end).toBeGreaterThanOrEqual(620);
 });
 it("resolves midnight and elapsed scale through DST and across midnight", () => {
  expect(new Date(businessDayStart("2026-03-08","America/New_York")).toISOString()).toBe("2026-03-08T05:00:00.000Z");
  const spring=buildTimeline([toAppointment({ ...dto, starts_at:"2026-03-08T01:30:00-05:00", ends_at:"2026-03-08T03:30:00-04:00" })],"America/New_York","2026-03-08",null,30,closedDay);
  expect(spring.professionals[0].items[0].end-spring.professionals[0].items[0].start).toBe(60);
  expect(spring.ticks.map(t=>t.label)).toEqual(["01:30","03:00","03:30"]);
  const fall=buildTimeline([toAppointment({ ...dto, starts_at:"2026-11-01T01:30:00-04:00", ends_at:"2026-11-01T01:30:00-05:00" })],"America/New_York","2026-11-01",null,30,closedDay);
  expect(fall.professionals[0].items[0].end-fall.professionals[0].items[0].start).toBe(60);
  expect(fall.ticks.map(t=>t.label)).toEqual(["01:30","01:00","01:30"]);
  const night=buildTimeline([toAppointment({ ...dto, starts_at:"2026-10-20T23:30:00-03:00", ends_at:"2026-10-21T00:30:00-03:00" })],zone,"2026-10-20",null,30,closedDay);
  expect(night.ticks.at(-1)?.date).toBe("2026-10-21");
 });
});

describe("business hours context", () => {
 const hours = { ...closedDay, isClosed: false, opensAt: "09:00", closesAt: "18:00" };
 it.each([15,30,45,60] as const)("adds one configured %i minute interval on each side of opening hours", interval => {
  const model=buildTimeline([appointment(1,"10:00","10:30")],zone,"2026-10-20",null,interval,hours);
  expect([model.start,model.end]).toEqual([540-interval,1080+interval]);
  expect(model.outsideHours).toEqual([{start:540-interval,end:540},{start:1080,end:1080+interval}]);
 });
 it("retains early and overnight historical appointments beyond the context margins", () => {
  const night=toAppointment({...dto,id:2,starts_at:"2026-10-20T23:30:00-03:00",ends_at:"2026-10-21T00:30:00-03:00"});
  const model=buildTimeline([appointment(1,"07:15","08:15"),night],zone,"2026-10-20",null,30,hours);
  expect([model.start,model.end]).toEqual([420,1470]);
  expect(model.outsideHours).toEqual([{start:420,end:540},{start:1080,end:1470}]);
  expect(model.ordered).toHaveLength(2);
 });
 it("shades a closed day's full historical range", () => {
  const model=buildTimeline([appointment(1,"10:00","11:00")],zone,"2026-10-20",null,30,closedDay);
  expect(model.outsideHours).toEqual([{start:600,end:660}]);
 });
 it("labels context crossing midnight and resolves opening hours in the business zone across DST", () => {
  const model=buildTimeline([appointment(1,"00:30","01:00")],zone,"2026-10-20",null,30,{...hours,opensAt:"00:00"});
  expect(model.ticks[0].label).toBe("23:30");expect(relativeDayLabel("2026-10-20",model.ticks[0].date)).toBe("−1 día");
  const spring=buildTimeline([],"America/New_York","2026-03-08",null,30,hours);
  expect(spring.ticks[0].label).toBe("08:30");expect(spring.ticks.at(-1)?.label).toBe("18:30");
  expect(spring.outsideHours).toEqual([{start:450,end:480},{start:1020,end:1050}]);
 });
});
