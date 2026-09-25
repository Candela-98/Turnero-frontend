export const businessWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type BusinessDay = (typeof businessWeek)[number];

export const businessDayLabels: Record<BusinessDay, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export type BusinessHoursDayApiResponse = {
  id: number;
  day_of_week: BusinessDay;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

export type BusinessHoursListApiResponse = {
  data: BusinessHoursDayApiResponse[];
};

export type BusinessHoursDayFormValues = {
  dayOfWeek: BusinessDay;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

export type BusinessHoursFormValues = {
  days: BusinessHoursDayFormValues[];
};

export type BusinessHoursReplaceRequest = {
  hours: Array<{
    day_of_week: BusinessDay;
    opens_at: string | null;
    closes_at: string | null;
    is_closed: boolean;
  }>;
};

export type BusinessHoursDayErrors = {
  opensAt?: string;
  closesAt?: string;
};

export type BusinessHoursValidationResult = {
  days: Partial<Record<BusinessDay, BusinessHoursDayErrors>>;
  form?: string;
};

const timePattern = /^\d{2}:\d{2}$/;

function hasCompleteUniqueWeek(days: readonly { dayOfWeek: BusinessDay }[]) {
  return days.length === businessWeek.length && new Set(days.map((day) => day.dayOfWeek)).size === businessWeek.length;
}

export function toBusinessHoursFormValues(response: BusinessHoursListApiResponse): BusinessHoursFormValues {
  const daysByWeekday = new Map<BusinessDay, BusinessHoursDayApiResponse>();

  for (const day of response.data) {
    if (!businessWeek.includes(day.day_of_week) || daysByWeekday.has(day.day_of_week)) {
      throw new Error("Business hours response contains invalid days.");
    }
    daysByWeekday.set(day.day_of_week, day);
  }

  if (daysByWeekday.size !== businessWeek.length) {
    throw new Error("Business hours response does not contain a full week.");
  }

  return {
    days: businessWeek.map((dayOfWeek) => {
      const day = daysByWeekday.get(dayOfWeek);

      if (!day) throw new Error("Business hours response does not contain a full week.");

      return {
        dayOfWeek,
        opensAt: day.opens_at ?? "",
        closesAt: day.closes_at ?? "",
        isClosed: day.is_closed,
      };
    }),
  };
}

export function validateBusinessHoursFormValues(values: BusinessHoursFormValues): BusinessHoursValidationResult {
  if (!hasCompleteUniqueWeek(values.days)) {
    return {
      days: {},
      form: "La semana debe incluir los siete días, sin repetir ninguno.",
    };
  }

  const errors: Partial<Record<BusinessDay, BusinessHoursDayErrors>> = {};

  for (const day of values.days) {
    if (day.isClosed) continue;

    const dayErrors: BusinessHoursDayErrors = {};
    if (!timePattern.test(day.opensAt)) dayErrors.opensAt = "Ingresá una hora de apertura.";
    if (!timePattern.test(day.closesAt)) dayErrors.closesAt = "Ingresá una hora de cierre.";

    if (!dayErrors.opensAt && !dayErrors.closesAt && day.opensAt >= day.closesAt) {
      dayErrors.closesAt = "La hora de cierre debe ser posterior a la apertura.";
    }

    if (Object.keys(dayErrors).length > 0) errors[day.dayOfWeek] = dayErrors;
  }

  return { days: errors };
}

export function toBusinessHoursReplaceRequest(values: BusinessHoursFormValues): BusinessHoursReplaceRequest {
  const validation = validateBusinessHoursFormValues(values);

  if (validation.form || Object.keys(validation.days).length > 0) {
    throw new Error("Business hours form is invalid.");
  }

  return {
    hours: businessWeek.map((dayOfWeek) => {
      const day = values.days.find((candidate) => candidate.dayOfWeek === dayOfWeek);

      if (!day) throw new Error("Business hours form does not contain a full week.");

      return {
        day_of_week: day.dayOfWeek,
        opens_at: day.isClosed ? null : day.opensAt,
        closes_at: day.isClosed ? null : day.closesAt,
        is_closed: day.isClosed,
      };
    }),
  };
}
