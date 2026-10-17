import { afterEach, expect, it, vi } from "vitest";
import { getStaffMembers, staffMemberParams, toStaffMember } from "./api";
import { staffMemberKeys } from "./queries";

afterEach(() => vi.unstubAllGlobals());
const dto = { id: 1, business_id: 10, user_id: null, name: "Ana Pérez", role_label: " Directora ", specialty: null, avatar_url: "", status: "ACTIVE" as const };
const filters = { q: "  Ana & color  ", status: "INACTIVE" as const, page: 2, size: 20 };

it("maps wire fields and omits blank optional content", () => {
  expect(toStaffMember(dto)).toEqual({ id: 1, name: "Ana Pérez", roleLabel: "Directora", specialty: null, avatarUrl: null, status: "ACTIVE" });
});
it("encodes combined filters and omits default status and blank search", () => {
  expect(new URLSearchParams(staffMemberParams(filters)).get("q")).toBe("Ana & color");
  expect(staffMemberParams({ ...filters, q: " ", status: "ALL" })).toBe("page=2&size=20&sort=name%2Casc");
});
it("uses the BFF, maps results and forwards cancellation", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: [dto], page: { number: 2, size: 20, total_elements: 41, total_pages: 3 } }));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  const result = await getStaffMembers(filters, signal);
  expect(result.data[0]).toEqual(toStaffMember(dto));
  expect(result.page.total_elements).toBe(41);
  expect(fetch).toHaveBeenCalledWith(`/api/backend/api/v1/staff-members?${staffMemberParams(filters)}`, expect.objectContaining({ signal, credentials: "include" }));
});
it("isolates query keys by business and parameters", () => {
  expect(staffMemberKeys.list(1, filters)).not.toEqual(staffMemberKeys.list(2, filters));
  expect(staffMemberKeys.list(1, filters)).not.toEqual(staffMemberKeys.list(1, { ...filters, page: 0 }));
});
