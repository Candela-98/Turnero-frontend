import {
  demoAppointments,
  demoAvailabilitySlots,
  demoCustomers,
  demoServiceOfferings,
  demoStaffMembers,
} from "./data";
import type {
  AppointmentStatus,
  AvailabilitySlot,
  HydratedAppointment,
  StaffAgendaGroup,
} from "./types";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatPrice(priceCents: number) {
  return currencyFormatter.format(priceCents / 100);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

export function formatAppointmentDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

export function getIsoDate(value: string) {
  return value.slice(0, 10);
}

export function getStatusLabel(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    CANCELLED: "Cancelado",
    COMPLETED: "Completado",
    CONFIRMED: "Confirmado",
    NO_SHOW: "No asistio",
    PENDING: "Pendiente",
  };

  return labels[status];
}

export function getBlockingAppointmentStatuses(): AppointmentStatus[] {
  return ["PENDING", "CONFIRMED"];
}

export function hydrateAppointment(appointmentId: number): HydratedAppointment {
  const appointment = demoAppointments.find((item) => item.id === appointmentId);

  if (!appointment) {
    throw new Error(`Demo appointment not found: ${appointmentId}`);
  }

  const customer = demoCustomers.find((item) => item.id === appointment.customerId);
  const serviceOffering = demoServiceOfferings.find(
    (item) => item.id === appointment.serviceOfferingId,
  );
  const staffMember = demoStaffMembers.find((item) => item.id === appointment.staffMemberId);

  if (!customer || !serviceOffering || !staffMember) {
    throw new Error(`Demo appointment has missing relations: ${appointmentId}`);
  }

  return {
    ...appointment,
    customer,
    serviceOffering,
    staffMember,
  };
}

export function getAppointmentsByDate(date: string) {
  return demoAppointments
    .filter((appointment) => getIsoDate(appointment.startsAt) === date)
    .map((appointment) => hydrateAppointment(appointment.id))
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

export function getAppointmentsByStaffMember(staffMemberId: number, date?: string) {
  const appointments = date ? getAppointmentsByDate(date) : demoAppointments.map(({ id }) => hydrateAppointment(id));

  return appointments.filter((appointment) => appointment.staffMemberId === staffMemberId);
}

export function getAvailabilitySlotsByDate(date: string) {
  return demoAvailabilitySlots
    .filter((slot) => slot.date === date)
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

export function getAvailableSlotsForStaffMember(staffMemberId: number, date: string) {
  return getAvailabilitySlotsByDate(date).filter((slot) =>
    slot.staffMemberIds.includes(staffMemberId),
  );
}

export function getStaffAgendaGroups(date: string): StaffAgendaGroup[] {
  return demoStaffMembers
    .filter((staffMember) => staffMember.status === "ACTIVE")
    .map((staffMember) => ({
      staffMember,
      appointments: getAppointmentsByStaffMember(staffMember.id, date),
      slots: getAvailableSlotsForStaffMember(staffMember.id, date),
    }));
}

export function getServiceOfferingStaff(serviceOfferingId: number) {
  return demoStaffMembers.filter(
    (staffMember) =>
      staffMember.status === "ACTIVE" && staffMember.serviceOfferingIds.includes(serviceOfferingId),
  );
}

export function getBookingSlots(serviceOfferingId: number, date: string): AvailabilitySlot[] {
  return getAvailabilitySlotsByDate(date).filter(
    (slot) => slot.available && slot.serviceOfferingId === serviceOfferingId,
  );
}
