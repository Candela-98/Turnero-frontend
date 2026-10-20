import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { CustomerDetail, CustomerSummary } from "./api";
import { customerKeys, refreshCustomers } from "./queries";
import { applyCustomerStatus, changeCustomerStatus } from "./status";

afterEach(() => vi.unstubAllGlobals());
const customer: CustomerSummary = { id: 4, name: "Ana", email: "ana@example.com", phoneNumber: "123", status: "ACTIVE", publicBookingBlocked: false };
const detail: CustomerDetail = { ...customer, internalNotes: "Notas privadas", publicBookingBlockReason: null };
const filters = { q: "", status: "ALL" as const, page: 0, size: 20 };
it("deactivates via DELETE and accepts an empty 204 response", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal("fetch", fetch);
  expect(await changeCustomerStatus(customer)).toEqual({ id: 4, status: "INACTIVE" });
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/customers/4", expect.objectContaining({ method: "DELETE", body: undefined, credentials: "include" }));
});
it("reactivates with only status and adapts the confirmed detail", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ id: 4, name: "Ana", status: "ACTIVE", public_booking_blocked: false, phone_number: "123", internal_notes: "Notas privadas" })); vi.stubGlobal("fetch", fetch);
  expect(await changeCustomerStatus({ ...customer, status: "INACTIVE" })).toEqual({ id: 4, status: "ACTIVE", detail: { ...detail, email: null } });
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/customers/4", expect.objectContaining({ method: "PATCH", body: '{"status":"ACTIVE"}' }));
});
it("does not reinterpret a malformed successful PATCH representation as a failed write", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ unexpected: true })));
  expect(await changeCustomerStatus({ ...customer, status: "INACTIVE" })).toEqual({ id: 4, status: "ACTIVE", detail: undefined });
});
it("keeps a rejected write as an API error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ code: "NOT_FOUND" }, { status: 404 })));
  await expect(changeCustomerStatus(customer)).rejects.toBeInstanceOf(ApiError);
});
it("preserves private detail, removes incompatible rows and isolates cached businesses", async () => {
  const client = new QueryClient();
  const all = customerKeys.list(1, filters), active = customerKeys.list(1, { ...filters, status: "ACTIVE" }), other = customerKeys.list(2, filters);
  const page = { data: [customer], page: { number: 0, size: 20, totalElements: 1, totalPages: 1 } };
  for (const key of [all, active, other]) client.setQueryData(key, page);
  client.setQueryData(customerKeys.detail(1, 4), detail);
  await applyCustomerStatus(client, 1, { id: 4, status: "INACTIVE" });
  expect(client.getQueryData(customerKeys.detail(1, 4))).toEqual({ ...detail, status: "INACTIVE" });
  expect(client.getQueryData(all)).toMatchObject({ data: [{ ...customer, status: "INACTIVE" }] });
  expect(client.getQueryData(active)).toMatchObject({ data: [], page: { totalElements: 0, totalPages: 0 } });
  expect(client.getQueryData(other)).toEqual(page);
  client.clear();
});
it("never fabricates a detail from a row and ignores selector shapes while invalidating them", async () => {
  const client = new QueryClient();
  const selector = [...customerKeys.all(1), "selector"];
  client.setQueryData(selector, [customer]);
  await applyCustomerStatus(client, 1, { id: 4, status: "INACTIVE" });
  expect(client.getQueryData(customerKeys.detail(1, 4))).toBeUndefined();
  expect(client.getQueryData(selector)).toEqual([customer]);
  await refreshCustomers(client, 1, 4);
  expect(client.getQueryState(selector)?.isInvalidated).toBe(true);
  client.clear();
});
it("cancels stale list and detail requests before applying the confirmed state", async () => {
  const client = new QueryClient();
  const key = customerKeys.detail(1, 4); client.setQueryData(key, detail);
  let release!: (result: CustomerDetail) => void;
  const pending = client.fetchQuery({ queryKey: key, queryFn: ({ signal }) => { void signal.aborted; return new Promise<CustomerDetail>(resolve => { release = resolve; }); } }).catch(() => undefined);
  await applyCustomerStatus(client, 1, { id: 4, status: "INACTIVE" });
  release(detail); await pending;
  expect(client.getQueryData(key)).toEqual({ ...detail, status: "INACTIVE" });
  client.clear();
});

it("blocks with only the flag and trimmed private reason without changing archive status", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ unexpected: true })); vi.stubGlobal("fetch", fetch);
  expect(await changeCustomerStatus({ ...customer, status: "INACTIVE" }, "block", " Ausencias ")).toEqual({
    id: 4, publicBookingBlocked: true, publicBookingBlockReason: "Ausencias", detail: undefined,
  });
  expect(fetch).toHaveBeenCalledWith("/api/backend/api/v1/customers/4", expect.objectContaining({ method: "PATCH", body: '{"public_booking_blocked":true,"public_booking_block_reason":"Ausencias"}' }));
});
it("unblocks without restoring an archived customer and clears the confirmed reason", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ unexpected: true })));
  const result = await changeCustomerStatus({ ...customer, status: "INACTIVE", publicBookingBlocked: true }, "unblock");
  expect(result).toEqual({ id: 4, publicBookingBlocked: false, publicBookingBlockReason: null, detail: undefined });
});
it("preserves archive and notes while updating block filters and keeps other businesses isolated", async () => {
  const client = new QueryClient();
  const key = customerKeys.detail(1, 4);
  client.setQueryData(key, { ...detail, status: "INACTIVE" });
  const allowed = customerKeys.list(1, { ...filters, publicBookingBlocked: false });
  const other = customerKeys.list(2, { ...filters, publicBookingBlocked: false });
  const page = { data: [customer], page: { number: 0, size: 20, totalElements: 1, totalPages: 1 } };
  client.setQueryData(allowed, page); client.setQueryData(other, page);
  await applyCustomerStatus(client, 1, { id: 4, publicBookingBlocked: true, publicBookingBlockReason: "Motivo" });
  expect(client.getQueryData(key)).toEqual({ ...detail, status: "INACTIVE", publicBookingBlocked: true, publicBookingBlockReason: "Motivo" });
  expect(client.getQueryData(allowed)).toMatchObject({ data: [], page: { totalElements: 0 } });
  expect(client.getQueryData(other)).toEqual(page); client.clear();
});
it("restoring keeps a previously confirmed block when the response cannot be trusted", async () => {
  const client = new QueryClient(), key = customerKeys.detail(1, 4);
  client.setQueryData(key, { ...detail, status: "INACTIVE", publicBookingBlocked: true, publicBookingBlockReason: "Motivo" });
  await applyCustomerStatus(client, 1, { id: 4, status: "ACTIVE" });
  expect(client.getQueryData(key)).toMatchObject({ status: "ACTIVE", publicBookingBlocked: true, publicBookingBlockReason: "Motivo", internalNotes: "Notas privadas" });
  client.clear();
});
