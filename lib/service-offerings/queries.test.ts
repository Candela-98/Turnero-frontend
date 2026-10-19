import { staffMemberKeys } from "@/lib/staff-members/queries";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { applyServiceStatus, applyServiceRemoval, serviceOfferingKeys } from "./queries";
import type { ServiceFilters, ServiceOffering } from "./api";

const service: ServiceOffering = { id: 1, name: "Corte", category: "Corte", durationMinutes: 30, priceCents: 600000, status: "ACTIVE" };
const filters: ServiceFilters = { q: "", category: "", status: "ALL", page: 0, size: 20 };
const page = { number: 0, size: 20, total_elements: 1, total_pages: 1 };

describe("confirmed deactivation cache", () => {
  it("updates only the business concerned and preserves unfiltered totals", async () => {
    const client = new QueryClient();
    const own = [...serviceOfferingKeys.list(10), filters];
    const other = [...serviceOfferingKeys.list(20), filters];
    client.setQueryData(own, { data: [service], page });
    client.setQueryData(other, { data: [service], page });
    await applyServiceStatus(client, 10, service, "INACTIVE");
    expect(client.getQueryData(serviceOfferingKeys.detail(10, 1))).toMatchObject({ status: "INACTIVE" });
    expect(client.getQueryData(own)).toEqual({ data: [{ ...service, status: "INACTIVE" }], page });
    expect(client.getQueryData(other)).toEqual({ data: [service], page });
    client.clear();
  });

  it("removes the service from active pages and clamps their totals", async () => {
    const client = new QueryClient();
    const active = [...serviceOfferingKeys.list(10), { ...filters, status: "ACTIVE" }];
    client.setQueryData(active, { data: [service], page });
    await applyServiceStatus(client, 10, service, "INACTIVE");
    expect(client.getQueryData(active)).toEqual({ data: [], page: { ...page, total_elements: 0, total_pages: 0 } });
    // Re-applying a confirmed state must not decrement an already updated page.
    await applyServiceStatus(client, 10, service, "INACTIVE");
    expect(client.getQueryData(active)).toMatchObject({ page: { total_elements: 0 } });
    client.clear();
  });
  it("restores an inactive service and removes it from inactive results", async () => {
    const client = new QueryClient();
    const inactive = { ...service, status: "INACTIVE" as const };
    const all = [...serviceOfferingKeys.list(10), filters];
    const selected = [...serviceOfferingKeys.list(10), { ...filters, status: "INACTIVE" }];
    client.setQueryData(all, { data: [inactive], page });
    client.setQueryData(selected, { data: [inactive], page });
    await applyServiceStatus(client, 10, inactive, "ACTIVE");
    expect(client.getQueryData(all)).toEqual({ data: [service], page });
    expect(client.getQueryData(selected)).toMatchObject({ data: [], page: { total_elements: 0 } });
    client.clear();
  });
  it("removes catalog and editor data only for the current business", async () => {
    const client = new QueryClient();
    const own = [...serviceOfferingKeys.list(10), filters];
    const other = [...serviceOfferingKeys.list(20), filters];
    client.setQueryData(own, { data: [service], page });
    client.setQueryData(other, { data: [service], page });
    client.setQueryData(serviceOfferingKeys.detail(10, 1), service);
    const staff = staffMemberKeys.list(10, { q: "", status: "ALL", page: 0, size: 20 });
    const foreignStaff = staffMemberKeys.list(20, { q: "", status: "ALL", page: 0, size: 20 });
    client.setQueryData(staff, { data: [{ id: 5, serviceCount: 1 }] });
    client.setQueryData(foreignStaff, { data: [{ id: 5, serviceCount: 1 }] });
    await applyServiceRemoval(client, 10, 1);
    expect(client.getQueryState(staff)?.isInvalidated).toBe(true);
    expect(client.getQueryState(foreignStaff)?.isInvalidated).toBe(false);
    expect(client.getQueryData(own)).toMatchObject({ data: [], page: { total_elements: 0 } });
    expect(client.getQueryData(other)).toEqual({ data: [service], page });
    expect(client.getQueryData(serviceOfferingKeys.detail(10, 1))).toBeUndefined();
    await applyServiceRemoval(client, 10, 1);
    expect(client.getQueryData(own)).toMatchObject({ page: { total_elements: 0 } });
    client.clear();
  });

});
