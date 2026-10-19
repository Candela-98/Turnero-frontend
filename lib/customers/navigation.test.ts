import { expect, it } from "vitest";
import { customerContextSearch, customerListContext } from "./navigation";

it("restores the URL context and round-trips encoded contact searches", () => {
  const filters = customerListContext(new URLSearchParams("q=%2B54+%2811%29&status=INACTIVE&page=2"));
  expect(filters).toEqual({ q: "+54 (11)", status: "INACTIVE", page: 2, size: 20 });
  expect(customerListContext(new URLSearchParams(customerContextSearch(filters)))).toEqual(filters);
  expect(customerContextSearch(customerListContext(new URLSearchParams()))).toBe("");
});
it.each(["-1", "1.5", "oops", "2147483648", "Infinity"])("normalizes invalid URL page %s", page => {
  expect(customerListContext(new URLSearchParams({ page, status: "UNKNOWN" }))).toMatchObject({ page: 0, status: "ALL" });
});
it("normalizes an oversized URL query instead of sending an invalid API request", () => {
  expect(customerListContext(new URLSearchParams({ q: "x".repeat(101) })).q).toBe("");
});
