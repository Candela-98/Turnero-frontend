import { QueryClient } from "@tanstack/react-query";
import { expect, it } from "vitest";
import { applyCustomerWrite, customerKeys, refreshCustomers } from "./queries";
import type { CustomerDetail } from "./api";

const saved: CustomerDetail = { id: 3, name: "Ana", status: "ACTIVE", phoneNumber: "123", email: null, internalNotes: "Private", publicBookingBlocked: false, publicBookingBlockReason: null };
const filters = { q: "", status: "ALL" as const, page: 0, size: 20 };
it("cancels old detail reads before applying a confirmed write, without affecting another business", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const other = customerKeys.detail(2, 3);
  client.setQueryData(other, { ...saved, name: "Other business" });
  let release!: (data: CustomerDetail) => void;
  const pending = client.fetchQuery({ queryKey: customerKeys.detail(1, 3), queryFn: ({ signal }) => {
    void signal.aborted;
    return new Promise<CustomerDetail>(resolve => { release = resolve; });
  } }).catch(() => undefined);
  await applyCustomerWrite(client, 1, saved);
  release({ ...saved, name: "Old response" }); await pending;
  expect(client.getQueryData(customerKeys.detail(1, 3))).toEqual(saved);
  expect(client.getQueryData(other)).toMatchObject({ name: "Other business" });
  client.clear();
});
it("invalidates all customer lists/selectors and detail for the same business", async () => {
  const client = new QueryClient();
  const list = customerKeys.list(1, filters), selector = [...customerKeys.all(1), "selector"], other = customerKeys.list(2, filters);
  for (const key of [list, selector, other]) client.setQueryData(key, { data: [] });
  await applyCustomerWrite(client, 1, saved);
  await refreshCustomers(client, 1, 3);
  expect(client.getQueryState(list)?.isInvalidated).toBe(true);
  expect(client.getQueryState(selector)?.isInvalidated).toBe(true);
  expect(client.getQueryState(customerKeys.detail(1, 3))?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  client.clear();
});
