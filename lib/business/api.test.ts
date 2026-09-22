import { afterEach, describe, expect, it, vi } from "vitest";

import { getBusiness, updateBusiness } from "./api";
import { toBusinessFormValues, toBusinessUpdateRequest } from "./types";

const business = {
  address: "Av. Siempre Viva 123",
  created_at: "2026-09-17T10:00:00",
  email: "hola@barberstudio.demo",
  id: 10,
  industry: "Barbería",
  name: "Barber Studio",
  onboarding_status: "COMPLETED",
  phone: "+54 11 5555-5555",
  slug: "barber-studio",
  status: "ACTIVE",
  timezone: "America/Argentina/Buenos_Aires",
  updated_at: "2026-09-17T10:00:00",
};

describe("business api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the current business through the same-origin BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(business), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getBusiness()).resolves.toEqual(business);
    expect(fetchMock).toHaveBeenCalledWith("/api/backend/api/v1/business", {
      body: undefined,
      credentials: "include",
      headers: {},
      method: "GET",
    });
  });

  it("updates only the editable business fields", async () => {
    const request = toBusinessUpdateRequest(toBusinessFormValues(business));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(business), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateBusiness(request)).resolves.toEqual(business);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/backend/api/v1/business");
    expect(options.credentials).toBe("include");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body as string)).toEqual({
      address: "Av. Siempre Viva 123",
      email: "hola@barberstudio.demo",
      industry: "Barbería",
      name: "Barber Studio",
      phone: "+54 11 5555-5555",
      timezone: "America/Argentina/Buenos_Aires",
    });
  });

  it("normalizes nullable API values for the editable form", () => {
    expect(toBusinessFormValues({ ...business, address: null, email: null, industry: null, phone: null })).toEqual({
      address: "",
      email: "",
      industry: "",
      name: "Barber Studio",
      phone: "",
      timezone: "America/Argentina/Buenos_Aires",
    });
  });
});
