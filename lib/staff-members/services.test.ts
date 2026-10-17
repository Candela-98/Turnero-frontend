import { afterEach, expect, it, vi } from "vitest";
import { getStaffServices, replaceStaffServices, sameServiceSelection, selectedServiceIds } from "./services";
import { toServiceOffering } from "@/lib/service-offerings/api";

const dto = { id: 30, name: "Corte", category: "Pelo", duration_minutes: 30, price_cents: 1000, status: "INACTIVE" as const };
const service = toServiceOffering(dto);
afterEach(() => vi.unstubAllGlobals());
it("reads the plain association array with the shared adapter and abort signal", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json([dto])); vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  expect(await getStaffServices(5, signal)).toEqual([service]);
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/staff-members/5/service-offerings", expect.objectContaining({ signal, method: "GET", credentials: "include" }));
});
it("compares complete sets independently of order and normalizes the full replacement payload", async () => {
  const other = { ...service, id: 2 };
  expect(sameServiceSelection([service, other], [other, service, service])).toBe(true);
  expect(sameServiceSelection([service], [other])).toBe(false);
  expect(selectedServiceIds([service, other, service])).toEqual([2, 30]);
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal("fetch", fetch);
  expect(await replaceStaffServices(5, [service, other, service])).toBeUndefined();
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/staff-members/5/service-offerings", expect.objectContaining({ method: "PUT", body: '{"service_offering_ids":[2,30]}' }));
});
it("supports removing every association", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal("fetch", fetch);
  await replaceStaffServices(5, []);
  expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ body: '{"service_offering_ids":[]}' }));
});
