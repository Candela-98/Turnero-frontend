import { afterEach, describe, expect, it, vi } from "vitest";

import { getBusinessHours, replaceBusinessHours } from "./api";
import {
  toBusinessHoursFormValues,
  toBusinessHoursReplaceRequest,
  type BusinessHoursListApiResponse,
  validateBusinessHoursFormValues,
} from "./types";

const week: BusinessHoursListApiResponse = {
  data: [
    { closes_at: "18:00", day_of_week: "SUNDAY", id: 7, is_closed: false, opens_at: "09:00" },
    { closes_at: "18:00", day_of_week: "TUESDAY", id: 2, is_closed: false, opens_at: "09:00" },
    { closes_at: null, day_of_week: "MONDAY", id: 1, is_closed: true, opens_at: null },
    { closes_at: "18:00", day_of_week: "WEDNESDAY", id: 3, is_closed: false, opens_at: "09:00" },
    { closes_at: "18:00", day_of_week: "THURSDAY", id: 4, is_closed: false, opens_at: "09:00" },
    { closes_at: "18:00", day_of_week: "FRIDAY", id: 5, is_closed: false, opens_at: "09:00" },
    { closes_at: "18:00", day_of_week: "SATURDAY", id: 6, is_closed: false, opens_at: "09:00" },
  ],
};

describe("business hours api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the weekly hours through the same-origin BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(week), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getBusinessHours()).resolves.toEqual(week);
    expect(fetchMock).toHaveBeenCalledWith("/api/backend/api/v1/business-hours", {
      body: undefined,
      credentials: "include",
      headers: {},
      method: "GET",
    });
  });

  it("replaces the complete week and serializes closed days with null hours", async () => {
    const request = toBusinessHoursReplaceRequest(toBusinessHoursFormValues(week));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(week), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(replaceBusinessHours(request)).resolves.toEqual(week);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/backend/api/v1/business-hours");
    expect(options.credentials).toBe("include");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body as string)).toEqual({
      hours: [
        { closes_at: null, day_of_week: "MONDAY", is_closed: true, opens_at: null },
        { closes_at: "18:00", day_of_week: "TUESDAY", is_closed: false, opens_at: "09:00" },
        { closes_at: "18:00", day_of_week: "WEDNESDAY", is_closed: false, opens_at: "09:00" },
        { closes_at: "18:00", day_of_week: "THURSDAY", is_closed: false, opens_at: "09:00" },
        { closes_at: "18:00", day_of_week: "FRIDAY", is_closed: false, opens_at: "09:00" },
        { closes_at: "18:00", day_of_week: "SATURDAY", is_closed: false, opens_at: "09:00" },
        { closes_at: "18:00", day_of_week: "SUNDAY", is_closed: false, opens_at: "09:00" },
      ],
    });
  });

  it("normalizes an unordered API response from Monday through Sunday", () => {
    expect(toBusinessHoursFormValues(week).days.map((day) => day.dayOfWeek)).toEqual([
      "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
    ]);
  });

  it("rejects incomplete or duplicate weeks before they can be sent", () => {
    expect(() => toBusinessHoursFormValues({ data: week.data.slice(0, 6) })).toThrow();
    expect(() => toBusinessHoursFormValues({ data: [...week.data.slice(0, 6), week.data[0]] })).toThrow();
  });

  it("reports incomplete and invalid open-day ranges", () => {
    const incomplete = toBusinessHoursFormValues(week);
    incomplete.days[1].opensAt = "";
    expect(validateBusinessHoursFormValues(incomplete).days.TUESDAY?.opensAt).toBeDefined();

    const invalidRange = toBusinessHoursFormValues(week);
    invalidRange.days[1].opensAt = "18:00";
    invalidRange.days[1].closesAt = "09:00";
    expect(validateBusinessHoursFormValues(invalidRange).days.TUESDAY?.closesAt).toBeDefined();
  });
});
