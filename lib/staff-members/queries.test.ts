import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { refreshStaffMembers, staffMemberKeys } from "./queries";

it("refreshes all filter variants and the detail only for the affected business", async () => {
  const client = new QueryClient();
  const filters = { q: "", status: "ALL" as const, page: 0, size: 20 };
  const list = staffMemberKeys.list(1, filters), other = staffMemberKeys.list(2, filters), detail = staffMemberKeys.detail(1, 5);
  for (const key of [list, other, detail]) client.setQueryData(key, {});
  await refreshStaffMembers(client, 1, 5);
  expect(client.getQueryState(list)?.isInvalidated).toBe(true);
  expect(client.getQueryState(detail)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  client.clear();
});
it("reports refresh failures for active queries so the UI can retry reads only", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const queryFn = vi.fn().mockRejectedValue(new Error("offline"));
  const observer = new QueryObserver(client, { queryKey: staffMemberKeys.detail(1, 5), queryFn, initialData: {} });
  const unsubscribe = observer.subscribe(() => {});
  await expect(refreshStaffMembers(client, 1, 5)).rejects.toThrow("offline");
  expect(queryFn).toHaveBeenCalled();
  unsubscribe(); client.clear();
});
