import { ApiError, apiFetch } from "@/lib/api/client";

type ProfileDto = {
  business: { name: string; timezone: string };
  booking_settings: { public_booking_enabled: boolean; booking_window_days: number };
};

type ServicesDto = {
  services: {
    id: number;
    name: string;
    duration_minutes: number;
    price_cents: number;
    staff_members: { id: number; name: string; role_label: string | null }[];
  }[];
};

type SlotDto = {
  starts_at: string;
  ends_at: string;
  available_staff_member_ids: number[];
};

export type BookingAvailability = {
  date: string;
  serviceId: number;
  staffId: number | "any";
};

export type BookingContact = { name: string; email: string; phone: string };

type AppointmentDto = {
  appointment_id: number;
  service_offering_id: number;
  staff_member_id: number;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  price_cents: number;
  status: "PENDING" | "CONFIRMED";
};

function businessPath(slug: string) {
  return `/api/v1/public/businesses/${encodeURIComponent(slug)}`;
}

export async function getBookingProfile(slug: string, signal?: AbortSignal) {
  const dto = await apiFetch<ProfileDto>(`${businessPath(slug)}/booking-profile`, { signal });
  return {
    business: dto.business,
    enabled: dto.booking_settings.public_booking_enabled,
    windowDays: dto.booking_settings.booking_window_days,
  };
}

export async function getBookingServices(slug: string, signal?: AbortSignal) {
  const dto = await apiFetch<ServicesDto>(`${businessPath(slug)}/services`, { signal });
  return dto.services.map((service) => ({
    id: service.id,
    name: service.name,
    durationMinutes: service.duration_minutes,
    priceCents: service.price_cents,
    staff: service.staff_members.map((member) => ({
      id: member.id,
      name: member.name,
      roleLabel: member.role_label,
    })),
  }));
}

export async function getBookingAvailability(
  slug: string,
  { date, serviceId, staffId }: BookingAvailability,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    from: date,
    to: date,
    service_offering_id: String(serviceId),
    staff_member_id: String(staffId),
  });
  const slots = await apiFetch<SlotDto[]>(`${businessPath(slug)}/availability?${params}`, { signal });

  return slots.map((slot) => ({
    startsAt: slot.starts_at,
    endsAt: slot.ends_at,
    staffIds: slot.available_staff_member_ids,
  })).sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

export function isBookingUnavailable(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}

export async function createBooking(
  slug: string,
  { serviceId, staffId, startsAt, contact }: Omit<BookingAvailability, "date"> & {
    startsAt: string;
    contact: BookingContact;
  },
) {
  const dto = await apiFetch<AppointmentDto>(`${businessPath(slug)}/appointments`, {
    method: "POST",
    body: {
      service_offering_id: serviceId,
      staff_member_id: String(staffId),
      starts_at: startsAt,
      customer: { name: contact.name.trim(), email: contact.email.trim(), phone_number: contact.phone.trim() },
    },
  });

  return {
    id: dto.appointment_id,
    serviceId: dto.service_offering_id,
    staffId: dto.staff_member_id,
    startsAt: dto.starts_at,
    endsAt: dto.ends_at,
    durationMinutes: dto.duration_minutes,
    priceCents: dto.price_cents,
    status: dto.status,
  };
}

export function bookingWriteFailure(error: unknown) {
  if (!(error instanceof ApiError)) return "unknown";
  if (error.status === 409 && error.code === "CONFLICT") return "slot";
  if (error.status === 409 && error.code === "CUSTOMER_IDENTITY_AMBIGUOUS") return "ambiguous";
  if (error.status === 403 && error.code === "CUSTOMER_BOOKING_BLOCKED") return "blocked";
  if (error.status === 403 && ["FORBIDDEN", "PUBLIC_BOOKING_DISABLED"].includes(error.code ?? "")) {
    return "unavailable";
  }
  return "unknown";
}

export function bookingSlotTime(localDateTime: string) {
  // Spring returns a wall-clock time in the business timezone without an offset.
  return localDateTime.slice(11, 16);
}
