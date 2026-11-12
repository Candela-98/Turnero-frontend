export function businessDate(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function validDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value);
}
export function shiftDay(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10);
}
export function clockTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}
export function localHour(value: string, timezone: string) { return Number(clockTime(value, timezone).slice(0, 2)); }

export function readableDate(date: string) {
  const label = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1);
}

export function businessDayStart(date: string, timezone: string) { return businessLocalTime(date, "00:00", timezone); }
/** Resolve a business local time, advancing through nonexistent times at a zone transition. */
export function businessLocalTime(date: string, time: string, timezone: string) {
  const target = Date.parse(`${date}T${time}:00Z`);
  let candidate = target;
  const seen = new Set<number>();
  const format = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let attempt = 0; attempt < 5; attempt++) {
    const parts = format.formatToParts(new Date(candidate));
    const get = (type: string) => Number(parts.find(part => part.type === type)!.value);
    const represented = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    const next = candidate + target - represented;
    if (next === candidate) return candidate;
    if (seen.has(next)) return Math.max(candidate, next); // nonexistent midnight: advance through the gap
    seen.add(candidate); candidate = next;
  }
  return candidate;
}

export function relativeDayLabel(date: string, otherDate: string) {
  const days = Math.round((Date.parse(`${otherDate}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86400000);
  return days === 0 ? "" : `${days > 0 ? "+" : "−"}${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}`;
}

export function compactDate(date: string) {
  const parts = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).formatToParts(new Date(`${date}T12:00:00Z`));
  const get = (type: string) => parts.find(part => part.type === type)!.value.replace(/\./g, "");
  const label = `${get("weekday")} ${get("day")} ${get("month")}`;
  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1);
}
