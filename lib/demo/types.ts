export type EntityStatus = "ACTIVE" | "INACTIVE";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type AppointmentSource = "ADMIN" | "PUBLIC_BOOKING";

export type StaffAvailabilityLabel =
  | "AVAILABLE_TODAY"
  | "MOSTLY_BOOKED"
  | "NEXT_SLOT"
  | "UNAVAILABLE";

export type Business = {
  id: number;
  name: string;
  slug: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  status: EntityStatus;
  policySummary: string;
};

export type BookingSettings = {
  publicBookingEnabled: boolean;
  requiresCustomerLogin: false;
  bookingWindowDays: number;
  minNoticeHours: number;
  cancellationNoticeHours: number;
  slotIntervalMinutes: number;
  manualConfirmationEnabled: boolean;
};

export type StaffMember = {
  id: number;
  name: string;
  roleLabel: string;
  specialty: string;
  avatarInitials: string;
  status: EntityStatus;
  serviceOfferingIds: number[];
  availabilityLabel: StaffAvailabilityLabel;
  availabilityText: string;
};

export type ServiceOffering = {
  id: number;
  name: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
  status: EntityStatus;
};

export type Customer = {
  id: number;
  name: string;
  phoneNumber: string;
  email: string;
  status: EntityStatus;
  lastAppointmentDate: string | null;
  nextAppointmentStartsAt: string | null;
  visitCount: number;
  internalNotes?: string;
};

export type Appointment = {
  id: number;
  customerId: number;
  serviceOfferingId: number;
  staffMemberId: number;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  priceCents: number;
  status: AppointmentStatus;
  source: AppointmentSource;
  customerNotes: string | null;
  internalNotes: string | null;
};

export type AvailabilitySlot = {
  id: string;
  date: string;
  startsAt: string;
  endsAt: string;
  staffMemberIds: number[];
  serviceOfferingId: number;
  available: boolean;
};

export type HydratedAppointment = Appointment & {
  customer: Customer;
  serviceOffering: ServiceOffering;
  staffMember: StaffMember;
};

export type StaffAgendaGroup = {
  staffMember: StaffMember;
  appointments: HydratedAppointment[];
  slots: AvailabilitySlot[];
};
