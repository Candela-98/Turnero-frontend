import { expect, it } from "vitest";
import { customerContextSearch, customerIdFromPath, customerListContext } from "./navigation";

it("restores the URL context and round-trips encoded contact searches", () => {
  const filters = customerListContext(new URLSearchParams("q=%2B54+%2811%29&status=INACTIVE&page=2"));
  expect(filters).toEqual({ q: "+54 (11)", status: "INACTIVE", page: 2, size: 20, publicBookingBlocked: undefined });
  expect(customerListContext(new URLSearchParams(customerContextSearch(filters)))).toEqual(filters);
  expect(customerContextSearch(customerListContext(new URLSearchParams()))).toBe("");
});
it.each(["-1", "1.5", "oops", "2147483648", "Infinity"])("normalizes invalid URL page %s", page => {
  expect(customerListContext(new URLSearchParams({ page, status: "UNKNOWN" }))).toMatchObject({ page: 0, status: "ACTIVE" });
});
it("normalizes an oversized URL query instead of sending an invalid API request", () => {
  expect(customerListContext(new URLSearchParams({ q: "x".repeat(101) })).q).toBe("");
});
it.each(["0", "-1", "01", "1.5", "1e2", "0x10", "abc", "9007199254740992"])("rejects invalid customer path ID %s", id => {
  expect(customerIdFromPath(id)).toBeNull();
});
it("accepts positive safe customer IDs", () => {
  expect(customerIdFromPath("42")).toBe(42);
  expect(customerIdFromPath("9007199254740991")).toBe(Number.MAX_SAFE_INTEGER);
});
it("round-trips both independent filters and includes ALL explicitly", () => {
  const filters = customerListContext(new URLSearchParams("status=ALL&public_booking_blocked=false&q=Ana&page=2"));
  expect(filters).toMatchObject({ status: "ALL", publicBookingBlocked: false, q: "Ana", page: 2 });
  expect(customerListContext(new URLSearchParams(customerContextSearch(filters)))).toEqual(filters);
  expect(customerListContext(new URLSearchParams())).toMatchObject({ status: "ACTIVE", publicBookingBlocked: undefined });
});
