import { apiFetch } from "@/lib/api/client";

export const statusLabels = { PENDING: "Pendiente", CONFIRMED: "Confirmado", CANCELLED: "Cancelado", COMPLETED: "Completado", NO_SHOW: "Ausente" } as const;
export type AppointmentStatus = keyof typeof statusLabels;
type ReferenceDto = { id: number; available: boolean; name: string | null; status: string | null };
export type AppointmentDto = {
  id: number; customer_id: number; staff_member_id: number; service_offering_id: number;
  starts_at: string; ends_at: string; duration_minutes: number; price_cents: number;
  status: AppointmentStatus; source: "ADMIN" | "PUBLIC_BOOKING";
  customer_notes: string | null; internal_notes: string | null; cancellation_reason: string | null;
  customer: ReferenceDto; staff_member: ReferenceDto & { deleted_at?: string | null }; service_offering: ReferenceDto;
};
export type Appointment = {
  id: number; customerId: number; staffMemberId: number; serviceOfferingId: number;
  startsAt: string; endsAt: string; durationMinutes: number; priceCents: number;
  status: AppointmentStatus; source: AppointmentDto["source"];
  customerName: string; staffMemberName: string; serviceOfferingName: string;
  staffMemberStatus: string | null; staffMemberDeletedAt: string | null; staffMemberAvailable: boolean;
  customerNotes: string | null; internalNotes: string | null; cancellationReason: string | null;
};
export type AgendaFilters = { staff: string; status: "ALL" | AppointmentStatus };
export type AppointmentPageDto = { data: AppointmentDto[]; page: { number: number; size: number; total_elements: number; total_pages: number } };
const referenceName = (reference: ReferenceDto, fallback: string) => reference.available && reference.name ? reference.name : fallback;
export function toAppointment(dto: AppointmentDto): Appointment {
  return { id: dto.id, customerId: dto.customer_id, staffMemberId: dto.staff_member_id, serviceOfferingId: dto.service_offering_id,
    startsAt: dto.starts_at, endsAt: dto.ends_at, durationMinutes: dto.duration_minutes, priceCents: dto.price_cents,
    status: dto.status, source: dto.source, customerName: referenceName(dto.customer, "Cliente no disponible"),
    staffMemberName: referenceName(dto.staff_member, "Profesional no disponible"), serviceOfferingName: referenceName(dto.service_offering, "Servicio no disponible"),
    staffMemberStatus: dto.staff_member.status, staffMemberDeletedAt: dto.staff_member.deleted_at ?? null, staffMemberAvailable: dto.staff_member.available,
    customerNotes: dto.customer_notes, internalNotes: dto.internal_notes, cancellationReason: dto.cancellation_reason };
}
export function appointmentParams(date: string, filters: AgendaFilters, page = 0) {
  const params = new URLSearchParams({ date, page: String(page), size: "100", sort: "starts_at,asc" });
  if (filters.staff) params.set("staff_member_id", filters.staff);
  if (filters.status !== "ALL") params.set("status", filters.status);
  return params;
}
/** Only resolve when every page succeeds; partial days must never appear complete. */
export async function getDayAppointments(date: string, filters: AgendaFilters, signal?: AbortSignal) {
  const appointments: Appointment[] = [];
  let expectedTotal: number | undefined;
  const ids = new Set<number>();
  for (let page = 0; ; page++) {
    signal?.throwIfAborted();
    const result = await apiFetch<AppointmentPageDto>(`/api/v1/appointments?${appointmentParams(date, filters, page)}`, { signal });
    if (result.page.number !== page || (page > 0 && result.data.length === 0 && page < result.page.total_pages)) throw new Error("Paginación de agenda inconsistente");
    if (expectedTotal !== undefined && result.page.total_elements !== expectedTotal) throw new Error("La agenda cambió durante la consulta. Reintentá.");
    expectedTotal = result.page.total_elements;
    for (const appointment of result.data) {
      if (ids.has(appointment.id)) throw new Error("La agenda cambió durante la consulta. Reintentá.");
      ids.add(appointment.id);
      appointments.push(toAppointment(appointment));
    }
    if (page + 1 >= result.page.total_pages) break;
  }
  if (appointments.length !== expectedTotal) throw new Error("No se pudo completar la agenda. Reintentá.");
  return appointments;
}
