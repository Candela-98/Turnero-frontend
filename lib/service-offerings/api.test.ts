import { afterEach, describe, expect, it, vi } from "vitest";

import { deactivateServiceOffering, restoreServiceOffering, removeServiceOffering, createServiceOffering, getServiceOffering, updateServiceOffering, getServiceOfferings, serviceOfferingParams, toServiceOffering } from "./api";

afterEach(() => vi.unstubAllGlobals());

it("deactivates without a body and accepts 204", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(deactivateServiceOffering(3)).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledWith("/api/backend/api/v1/service-offerings/3", expect.objectContaining({ method: "DELETE", body: undefined, credentials: "include" }));
});

it("propagates deactivation errors without automatic retries", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"message":"Failure"}', { status: 503, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(deactivateServiceOffering(3)).rejects.toMatchObject({ status: 503 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

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

const detailDto = { id: 3, name: "Corte", category: null, duration_minutes: 30, price_cents: 0, status: "ACTIVE" as const };
it("uses GET by id and maps the detail response", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(detailDto), { headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  expect((await getServiceOffering(3)).durationMinutes).toBe(30);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/api/v1/service-offerings/3");
});
it("uses POST and PATCH with editable wire fields", async () => {
  const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(detailDto), { headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  const request = { name: "Corte", category: "", duration_minutes: 30, price_cents: 0 };
  await createServiceOffering(request);
  await updateServiceOffering(3, { category: "" });
  expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/api/v1/service-offerings");
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", body: JSON.stringify(request) });
  expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PATCH", body: '{"category":""}' });
});

it("restores with a status-only PATCH and maps the confirmed response", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(detailDto), { headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  expect(await restoreServiceOffering(3)).toMatchObject({ id: 3, status: "ACTIVE" });
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "PATCH", body: '{"status":"ACTIVE"}' });
});

it("removes from catalog through logical deletion endpoint", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(removeServiceOffering(3)).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledWith("/api/backend/api/v1/service-offerings/3/catalog", expect.objectContaining({ method: "DELETE", body: undefined }));
});
