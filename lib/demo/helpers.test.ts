import { describe, expect, it } from "vitest";

import {
  formatDuration,
  formatPrice,
  getAppointmentsByDate,
  getAvailabilitySlotsByDate,
  getBookingSlots,
  getServiceOfferingStaff,
  getStaffAgendaGroups,
  getStatusLabel,
  hydrateAppointment,
} from "./helpers";

describe("demo helpers", () => {
  it("formats money and durations for the MVP locale", () => {
    expect(formatPrice(950000)).toBe("$ 9.500");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });

  it("hydrates appointments with customer, service and staff data", () => {
    const appointment = hydrateAppointment(103);

    expect(appointment.customer.name).toBe("Santiago Moreno");
    expect(appointment.serviceOffering.name).toBe("Corte + barba");
    expect(appointment.staffMember.name).toBe("Mateo Ruiz");
  });

  it("returns the daily agenda sorted by start time", () => {
    const appointments = getAppointmentsByDate("2026-04-28");

    expect(appointments).toHaveLength(6);
    expect(appointments[0]?.startsAt).toBe("2026-04-28T09:30:00-03:00");
    expect(appointments.at(-1)?.startsAt).toBe("2026-04-28T18:00:00-03:00");
  });

  it("groups active staff with their daily appointments and slots", () => {
    const groups = getStaffAgendaGroups("2026-04-28");

    expect(groups.map((group) => group.staffMember.name)).toEqual([
      "Mateo Ruiz",
      "Lucas Pereira",
      "Nicolas Vega",
    ]);
    expect(groups[0]?.appointments).toHaveLength(3);
    expect(groups[0]?.slots.length).toBeGreaterThan(0);
  });

  it("filters booking slots and staff by service", () => {
    expect(getBookingSlots(23, "2026-04-28")).toHaveLength(1);
    expect(getServiceOfferingStaff(23).map((staff) => staff.name)).toEqual([
      "Mateo Ruiz",
      "Lucas Pereira",
    ]);
  });

  it("maps appointment status labels", () => {
    expect(getStatusLabel("PENDING")).toBe("Pendiente");
    expect(getStatusLabel("CONFIRMED")).toBe("Confirmado");
  });

  it("returns availability slots by date sorted by start time", () => {
    const slots = getAvailabilitySlotsByDate("2026-04-28");

    expect(slots).toHaveLength(3);
    expect(slots[0]?.startsAt).toBe("2026-04-28T11:30:00-03:00");
  });
});
