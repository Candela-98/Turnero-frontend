import { afterEach, describe, expect, it, vi } from "vitest";

import { getBookingSettings, updateBookingSettings } from "./api";
import { toBookingSettingsFormValues, toBookingSettingsUpdateRequest } from "./types";

const bookingSettings = {
  booking_window_days: 7,
  cancellation_notice_hours: 3,
  created_at: "2026-09-22T10:00:00Z",
  manual_confirmation_enabled: true,
  min_notice_hours: 2,
  public_booking_enabled: true,
  requires_customer_login: false,
  slot_interval_minutes: 30,
  updated_at: "2026-09-22T10:00:00Z",
  whatsapp_reminders_enabled: false,
};

describe("booking settings api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads booking settings through the same-origin BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(bookingSettings), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getBookingSettings()).resolves.toEqual(bookingSettings);
    expect(fetchMock).toHaveBeenCalledWith("/api/backend/api/v1/booking-settings", {
      body: undefined,
      credentials: "include",
      headers: {},
      method: "GET",
    });
  });

  it("updates only the MVP editable fields", async () => {
    const request = toBookingSettingsUpdateRequest(toBookingSettingsFormValues(bookingSettings));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(bookingSettings), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateBookingSettings(request)).resolves.toEqual(bookingSettings);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/backend/api/v1/booking-settings");
    expect(options.credentials).toBe("include");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body as string)).toEqual({
      booking_window_days: 7,
      cancellation_notice_hours: 3,
      manual_confirmation_enabled: true,
      min_notice_hours: 2,
      public_booking_enabled: true,
      slot_interval_minutes: 30,
    });
  });

  it.each([15, 30, 45, 60])("preserves the allowed %i minute interval", (slotIntervalMinutes) => {
    const request = toBookingSettingsUpdateRequest({
      bookingWindowDays: "7",
      cancellationNoticeHours: "3",
      manualConfirmationEnabled: false,
      minNoticeHours: "2",
      publicBookingEnabled: true,
      slotIntervalMinutes: String(slotIntervalMinutes),
    });

    expect(request.slot_interval_minutes).toBe(slotIntervalMinutes);
  });
});
