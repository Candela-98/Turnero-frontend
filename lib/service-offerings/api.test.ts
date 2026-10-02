import { afterEach, describe, expect, it, vi } from "vitest";

import { getServiceOfferings, serviceOfferingParams, toServiceOffering } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("service offerings API", () => {
  it("maps API fields into presentation fields", () => {
    expect(toServiceOffering({ id: 1, name: "Corte", category: "Cabello", duration_minutes: 30, price_cents: 250000, status: "ACTIVE" }))
      .toEqual({ id: 1, name: "Corte", category: "Cabello", durationMinutes: 30, priceCents: 250000, status: "ACTIVE" });
  });

  it("sends combined filters and pagination", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [], page: { number: 2, size: 5, total_elements: 0, total_pages: 0 } }), { headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const filters = { q: "  barba  ", category: "Combo & color", status: "INACTIVE" as const, page: 2, size: 5 };

    await getServiceOfferings(filters);

    expect(fetchMock).toHaveBeenCalledWith(`/api/backend/api/v1/service-offerings?${serviceOfferingParams(filters)}`, expect.objectContaining({ credentials: "include" }));
    expect(serviceOfferingParams(filters)).toContain("category=Combo+%26+color");
  });
});
