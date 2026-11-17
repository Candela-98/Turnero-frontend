import { afterEach, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import { businessDate, shiftDay } from "@/lib/appointments/dates";
import { bookingSlotTime, bookingWriteFailure, createBooking, getBookingAvailability, getBookingProfile, getBookingServices, isBookingUnavailable } from "./api";

afterEach(() => vi.unstubAllGlobals());

it("reads profile and services through the BFF and adapts the Spring DTOs", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({
      business: { name: "Barber Studio", timezone: "America/Argentina/Buenos_Aires" },
      booking_settings: { public_booking_enabled: true, booking_window_days: 7 },
    }))
    .mockResolvedValueOnce(Response.json({
      services: [{
        id: 10, name: "Corte", duration_minutes: 30, price_cents: 25000,
        staff_members: [{ id: 100, name: "Mateo", role_label: "Barbero" }],
      }],
    }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(getBookingProfile("barber-studio")).resolves.toEqual({
    business: { name: "Barber Studio", timezone: "America/Argentina/Buenos_Aires" },
    enabled: true,
    windowDays: 7,
  });
  await expect(getBookingServices("barber-studio")).resolves.toEqual([{
    id: 10, name: "Corte", durationMinutes: 30, priceCents: 25000,
    staff: [{ id: 100, name: "Mateo", roleLabel: "Barbero" }],
  }]);
  const prefix = "/api/backend/api/v1/public/businesses/barber-studio";
  expect(fetchMock).toHaveBeenNthCalledWith(1, `${prefix}/booking-profile`, expect.objectContaining({ method: "GET" }));
  expect(fetchMock).toHaveBeenNthCalledWith(2, `${prefix}/services`, expect.objectContaining({ method: "GET" }));
});

it.each(["any", 100] as const)("requests one day for %s and preserves local slot times", async (staffId) => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json([
    { starts_at: "2026-11-16T18:30:00", ends_at: "2026-11-16T19:00:00", available_staff_member_ids: [100] },
    { starts_at: "2026-11-16T10:00:00", ends_at: "2026-11-16T10:30:00", available_staff_member_ids: [100] },
  ]));
  vi.stubGlobal("fetch", fetchMock);
  const signal = new AbortController().signal;

  const slots = await getBookingAvailability("barber-studio", { date: "2026-11-16", serviceId: 10, staffId }, signal);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe(`/api/backend/api/v1/public/businesses/barber-studio/availability?from=2026-11-16&to=2026-11-16&service_offering_id=10&staff_member_id=${staffId}`);
  expect(options.signal).toBe(signal);
  expect(slots.map((slot) => slot.startsAt)).toEqual(["2026-11-16T10:00:00", "2026-11-16T18:30:00"]);
  expect(bookingSlotTime(slots[1].startsAt)).toBe("18:30");
});

it("uses the business calendar around UTC midnight", () => {
  const instant = new Date("2026-11-17T01:30:00Z");
  const today = businessDate("America/Argentina/Buenos_Aires", instant);
  expect(today).toBe("2026-11-16");
  expect(shiftDay(today, 6)).toBe("2026-11-22");
});

it("distinguishes the public read 403 from a recoverable error", () => {
  expect(isBookingUnavailable(new ApiError("Public booking is disabled", 403, { code: "FORBIDDEN" }))).toBe(true);
  expect(isBookingUnavailable(new ApiError("Try again", 503, null))).toBe(false);
  expect(isBookingUnavailable(new TypeError("Network error"))).toBe(false);
});

it.each([
  ["any", "PENDING"],
  [101, "CONFIRMED"],
] as const)("posts %s with the exact local slot and reads the flat %s result", async (staffId, status) => {
  const startsAt = "2026-11-19T10:30:00";
  const endsAt = "2026-11-19T11:15:00";
  const fetchMock = vi.fn().mockResolvedValue(Response.json({
    appointment_id: 900, service_offering_id: 10, staff_member_id: 101,
    starts_at: startsAt, ends_at: endsAt, duration_minutes: 45, price_cents: 32000,
    status, cancel_token: "unused-test-token",
  }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(createBooking("barber-studio", {
    serviceId: 10, staffId, startsAt,
    contact: { name: " Ana ", email: " ana@example.test ", phone: " 11 5555 1234 " },
  })).resolves.toEqual({
    id: 900, serviceId: 10, staffId: 101, startsAt, endsAt, durationMinutes: 45, priceCents: 32000, status,
  });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/backend/api/v1/public/businesses/barber-studio/appointments");
  expect(options.method).toBe("POST");
  expect(JSON.parse(options.body)).toEqual({
    service_offering_id: 10, staff_member_id: String(staffId), starts_at: startsAt,
    customer: { name: "Ana", email: "ana@example.test", phone_number: "11 5555 1234" },
  });
});

it.each([
  [409, "CONFLICT", "slot"],
  [409, "CUSTOMER_IDENTITY_AMBIGUOUS", "ambiguous"],
  [403, "CUSTOMER_BOOKING_BLOCKED", "blocked"],
  [403, "FORBIDDEN", "unavailable"],
  [403, "PUBLIC_BOOKING_DISABLED", "unavailable"],
  [403, "BFF_ORIGIN_FORBIDDEN", "unknown"],
  [503, "UPSTREAM_UNAVAILABLE", "unknown"],
] as const)("classifies write error %s %s as %s", (status, code, outcome) => {
  expect(bookingWriteFailure(new ApiError("Spring error", status, { code }))).toBe(outcome);
});
