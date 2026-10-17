import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { serviceOfferingKeys } from "@/lib/service-offerings/queries";
import { staffMemberKeys } from "./queries";
import { applyStaffServices, refreshStaffServices, staffServiceKeys } from "./service-queries";

it("cancels stale reads, stores confirmed selection and invalidates the affected union within one business", async () => {
  const client = new QueryClient();
  const selection = [{ id: 30, name: "Corte", category: null, durationMinutes: 30, priceCents: 1000, status: "ACTIVE" as const }];
  const filters = { q: "Color", category: "", status: "ACTIVE" as const, page: 2, size: 20 };
  const affected = [staffServiceKeys.selection(1, 5), staffMemberKeys.list(1, { q: "", status: "ALL", page: 0, size: 20 }), staffMemberKeys.detail(1, 5),
    staffServiceKeys.catalog(1, filters), serviceOfferingKeys.detail(1, 20), serviceOfferingKeys.detail(1, 30)];
  const unrelated = [staffServiceKeys.selection(2, 5), staffServiceKeys.selection(1, 6), serviceOfferingKeys.detail(1, 99), staffServiceKeys.catalog(2, filters)];
  client.setQueryDefaults(staffServiceKeys.selection(1, 5), { queryFn: async () => selection });
  for (const key of [...affected, ...unrelated]) client.setQueryData(key, []);
  const cancel = vi.spyOn(client, "cancelQueries");
  await applyStaffServices(client, 1, 5, selection, [20, 30, 30]);
  expect(cancel).toHaveBeenCalledTimes(6);
  expect(client.getQueryData(staffServiceKeys.selection(1, 5))).toEqual(selection);
  await refreshStaffServices(client, 1, 5, [20, 30]);
  expect(client.getQueryData(staffServiceKeys.selection(1, 5))).toEqual(selection);
  for (const key of affected.slice(1)) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  client.clear();
});
it("aborts a late association response before it can overwrite a confirmed write", async () => {
  const client = new QueryClient();
  let signal: AbortSignal | undefined;
  const key = staffServiceKeys.selection(1, 5);
  const pending = client.fetchQuery({ queryKey: key, queryFn: options => { signal = options.signal; return new Promise(() => {}); } }).catch(() => {});
  await applyStaffServices(client, 1, 5, [], []);
  await pending;
  expect(signal?.aborted).toBe(true);
  expect(client.getQueryData(key)).toEqual([]);
  client.clear();
});
it("surfaces refresh errors without performing a write", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const read = vi.fn().mockRejectedValue(new Error("offline"));
  const observer = new QueryObserver(client, { queryKey: staffServiceKeys.selection(1, 5), queryFn: read, initialData: [] });
  const unsubscribe = observer.subscribe(() => {});
  await expect(refreshStaffServices(client, 1, 5, [])).rejects.toThrow("offline");
  unsubscribe(); client.clear();
});

it("updates the saved count across cached pages without changing another professional or business", async () => {
  const client = new QueryClient();
  const filters = { q: "", status: "ALL" as const, page: 0, size: 20 };
  const key = staffMemberKeys.list(1, filters), other = staffMemberKeys.list(2, filters);
  const data = { data: [{ id: 5, serviceCount: 4 }, { id: 6, serviceCount: 2 }], page: { number: 0, size: 20, total_elements: 2, total_pages: 1 } };
  client.setQueryData(key, data); client.setQueryData(other, data);
  await applyStaffServices(client, 1, 5, [], [1, 2]);
  expect(client.getQueryData(key)).toEqual({ ...data, data: [{ id: 5, serviceCount: 0 }, { id: 6, serviceCount: 2 }] });
  expect(client.getQueryData(other)).toEqual(data);
  client.clear();
});
