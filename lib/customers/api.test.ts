import { afterEach, expect, it, vi } from "vitest";
import { customerParams, getCustomers, toCustomerSummary, type CustomerFilters } from "./api";
import { customerKeys } from "./queries";

afterEach(() => vi.unstubAllGlobals());
const filters: CustomerFilters = { q: "", status: "ALL", page: 0, size: 20 };
it("maps summaries explicitly and treats empty or missing contacts as absent", () => {
  expect(toCustomerSummary({ id: 1, name: "Ana", email: " ana@example.com ", phone_number: " +54 (11) 1234 ", status: "ACTIVE" }))
    .toEqual({ id: 1, name: "Ana", email: "ana@example.com", phoneNumber: "+54 (11) 1234", status: "ACTIVE" });
  expect(toCustomerSummary({ id: 2, name: "Bruno", email: " ", phone_number: null, status: "INACTIVE" }))
    .toMatchObject({ email: null, phoneNumber: null, status: "INACTIVE" });
  expect(toCustomerSummary({ id: 3, name: "Carla", status: "ACTIVE" })).toMatchObject({ email: null, phoneNumber: null });
});
it("encodes literal queries, omits ALL and sends real page, size and sort", () => {
  expect(new URLSearchParams(customerParams(filters)).get("status")).toBeNull();
  const query = new URLSearchParams(customerParams({ ...filters, q: " +54 (11) & Ana ", status: "INACTIVE", page: 2, size: 10 }));
  expect(Object.fromEntries(query)).toEqual({ q: "+54 (11) & Ana", status: "INACTIVE", page: "2", size: "10", sort: "name,asc" });
});
it("maps page metadata and forwards session credentials and cancellation to the BFF", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: [{ id: 1, name: "Ana", phone_number: "123", status: "ACTIVE" }],
    page: { number: 2, size: 20, total_elements: 41, total_pages: 3 } }));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  expect(await getCustomers({ ...filters, page: 2 }, signal)).toEqual({ data: [{ id: 1, name: "Ana", phoneNumber: "123", email: null, status: "ACTIVE" }],
    page: { number: 2, size: 20, totalElements: 41, totalPages: 3 } });
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/customers?page=2&size=20&sort=name%2Casc", expect.objectContaining({ credentials: "include", signal, method: "GET" }));
});
it("isolates keys by business and every list parameter while canonicalizing whitespace", () => {
  const base = customerKeys.list(1, filters);
  expect(customerKeys.list(2, filters)).not.toEqual(base);
  for (const change of [{ page: 1 }, { size: 10 }, { q: "Ana" }, { status: "ACTIVE" as const }]) {
    expect(customerKeys.list(1, { ...filters, ...change })).not.toEqual(base);
  }
  expect(customerKeys.list(1, { ...filters, q: " Ana " })).toEqual(customerKeys.list(1, { ...filters, q: "Ana" }));
});
