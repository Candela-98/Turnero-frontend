export type BookingSettingsApiResponse = {
  public_booking_enabled: boolean;
  requires_customer_login: boolean;
  booking_window_days: number;
  min_notice_hours: number;
  cancellation_notice_hours: number;
  slot_interval_minutes: number;
  manual_confirmation_enabled: boolean;
  whatsapp_reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type BookingSettingsFormValues = {
  publicBookingEnabled: boolean;
  bookingWindowDays: string;
  minNoticeHours: string;
  cancellationNoticeHours: string;
  slotIntervalMinutes: string;
  manualConfirmationEnabled: boolean;
};

export type BookingSettingsUpdateRequest = Pick<
  BookingSettingsApiResponse,
  | "public_booking_enabled"
  | "booking_window_days"
  | "min_notice_hours"
  | "cancellation_notice_hours"
  | "slot_interval_minutes"
  | "manual_confirmation_enabled"
>;

export function toBookingSettingsFormValues(settings: BookingSettingsApiResponse): BookingSettingsFormValues {
  return {
    publicBookingEnabled: settings.public_booking_enabled,
    bookingWindowDays: String(settings.booking_window_days),
    minNoticeHours: String(settings.min_notice_hours),
    cancellationNoticeHours: String(settings.cancellation_notice_hours),
    slotIntervalMinutes: String(settings.slot_interval_minutes),
    manualConfirmationEnabled: settings.manual_confirmation_enabled,
  };
}

export function toBookingSettingsUpdateRequest(values: BookingSettingsFormValues): BookingSettingsUpdateRequest {
  return {
    public_booking_enabled: values.publicBookingEnabled,
    booking_window_days: Number(values.bookingWindowDays),
    min_notice_hours: Number(values.minNoticeHours),
    cancellation_notice_hours: Number(values.cancellationNoticeHours),
    slot_interval_minutes: Number(values.slotIntervalMinutes),
    manual_confirmation_enabled: values.manualConfirmationEnabled,
  };
}
