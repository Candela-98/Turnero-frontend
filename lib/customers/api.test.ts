import { afterEach, expect, it, vi } from "vitest";
import { createCustomer, customerParams, getCustomer, getCustomers, toCustomerDetail, toCustomerSummary, updateCustomer, type CustomerFilters } from "./api";
import { customerKeys } from "./queries";

afterEach(() => vi.unstubAllGlobals());
const filters: CustomerFilters = { q: "", status: "ALL", page: 0, size: 20 };
it("maps detail separately from summaries and preserves absent notes", () => {
  expect(toCustomerDetail({ id: 1, name: "Ana", status: "ACTIVE", internal_notes: " Nota " })).toMatchObject({ internalNotes: "Nota" });
  expect(toCustomerDetail({ id: 1, name: "Ana", status: "ACTIVE" }).internalNotes).toBeNull();
});
it("loads a cancellable detail and writes canonical POST/PATCH bodies through the BFF", async () => {
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ id: 1, name: "Ana", status: "INACTIVE", internal_notes: "Nota" })));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  expect(await getCustomer(1, signal)).toMatchObject({ id: 1, internalNotes: "Nota", status: "INACTIVE" });
  expect(fetch).toHaveBeenLastCalledWith("/api/backend/api/v1/customers/1", expect.objectContaining({ method: "GET", signal, credentials: "include" }));
  const body = { name: "Ana", phone_number: "+54 (11) 123", email: "", internal_notes: "Nota" };
  await createCustomer(body);
  expect(fetch).toHaveBeenLastCalledWith("/api/backend/api/v1/customers", expect.objectContaining({ method: "POST", body: JSON.stringify(body), credentials: "include" }));
  await updateCustomer(1, { internal_notes: "" });
  expect(fetch).toHaveBeenLastCalledWith("/api/backend/api/v1/customers/1", expect.objectContaining({ method: "PATCH", body: '{"internal_notes":""}' }));
});
it("maps summaries explicitly and treats empty or missing contacts as absent", () => {
  expect(toCustomerSummary({ id: 1, name: "Ana", email: " ana@example.com ", phone_number: " +54 (11) 1234 ", status: "ACTIVE" }))
    .toEqual({ id: 1, name: "Ana", email: "ana@example.com", phoneNumber: "+54 (11) 1234", status: "ACTIVE", publicBookingBlocked: false });
  expect(toCustomerSummary({ id: 2, name: "Bruno", email: " ", phone_number: null, status: "INACTIVE" }))
    .toMatchObject({ email: null, phoneNumber: null, status: "INACTIVE" });
  expect(toCustomerSummary({ id: 3, name: "Carla", status: "ACTIVE" })).toMatchObject({ email: null, phoneNumber: null });
});
it("encodes literal queries, sends ALL explicitly and sends real page, size and sort", () => {
  expect(new URLSearchParams(customerParams(filters)).get("status")).toBe("ALL");
  const query = new URLSearchParams(customerParams({ ...filters, q: " +54 (11) & Ana ", status: "INACTIVE", page: 2, size: 10 }));
  expect(Object.fromEntries(query)).toEqual({ q: "+54 (11) & Ana", status: "INACTIVE", page: "2", size: "10", sort: "name,asc" });
});
it("maps page metadata and forwards session credentials and cancellation to the BFF", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: [{ id: 1, name: "Ana", phone_number: "123", status: "ACTIVE", publicBookingBlocked: false }],
    page: { number: 2, size: 20, total_elements: 41, total_pages: 3 } }));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  expect(await getCustomers({ ...filters, page: 2 }, signal)).toEqual({ data: [{ id: 1, name: "Ana", phoneNumber: "123", email: null, status: "ACTIVE", publicBookingBlocked: false }],
    page: { number: 2, size: 20, totalElements: 41, totalPages: 3 } });
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/customers?page=2&size=20&sort=name%2Casc&status=ALL", expect.objectContaining({ credentials: "include", signal, method: "GET" }));
});
it("isolates keys by business and every list parameter while canonicalizing whitespace", () => {
  const base = customerKeys.list(1, filters);
  expect(customerKeys.list(2, filters)).not.toEqual(base);
  for (const change of [{ page: 1 }, { size: 10 }, { q: "Ana" }, { status: "ACTIVE" as const }]) {
    expect(customerKeys.list(1, { ...filters, ...change })).not.toEqual(base);
  }
  expect(customerKeys.list(1, { ...filters, q: " Ana " })).toEqual(customerKeys.list(1, { ...filters, q: "Ana" }));
});
it("keeps blocking separate from archive and private reason out of summaries", () => {
  const dto = { id: 1, name: "Ana", status: "INACTIVE" as const, public_booking_blocked: true, public_booking_block_reason: " Motivo privado " };
  expect(toCustomerDetail(dto)).toMatchObject({ status: "INACTIVE", publicBookingBlocked: true, publicBookingBlockReason: "Motivo privado" });
  expect(toCustomerSummary(dto)).not.toHaveProperty("publicBookingBlockReason");
  const params = new URLSearchParams(customerParams({ ...filters, status: "INACTIVE", publicBookingBlocked: false }));
  expect(params.get("public_booking_blocked")).toBe("false");
  expect(params.get("status")).toBe("INACTIVE");
});
