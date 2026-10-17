import { expect, it } from "vitest";
import { staffContextSearch, staffIdFromPath, staffListContext } from "./navigation";
it("round trips list context without accepting arbitrary return URLs", () => {
  const filters = staffListContext(new URLSearchParams("q=Ana&status=ACTIVE&page=2&returnTo=https://other.test"));
  expect(filters).toEqual({ q: "Ana", status: "ACTIVE", page: 2, size: 20 });
  expect(staffContextSearch(filters)).toBe("?q=Ana&status=ACTIVE&page=2");
});
it("defaults invalid filters and rejects unsafe or invalid path IDs", () => {
  for (const page of ["-1", "abc", "1.2", "2147483648"]) expect(staffListContext(new URLSearchParams({ page })).page).toBe(0);
  expect(staffListContext(new URLSearchParams({ status: "other", q: "a".repeat(101) }))).toEqual({q:"",status:"ALL",page:0,size:20});
  expect(staffContextSearch(staffListContext(new URLSearchParams()))).toBe("");
  for (const id of ["me", "-1", "0", "1.2", "9007199254740992", "<script>"]) expect(staffIdFromPath(id)).toBeNull();
  expect(staffIdFromPath("12")).toBe(12);
});
