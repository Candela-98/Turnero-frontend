import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { changedServiceFields, hasServiceFormChanges, priceToCents, serviceApiFieldErrors, toServiceFormValues, toServiceWriteRequest, validateServiceForm } from "./form";

const service = { id: 1, name: "Corte", category: "Corte", durationMinutes: 30, priceCents: 600050, status: "INACTIVE" as const };
const baseline = toServiceFormValues(service);

describe("service form", () => {
  it.each([["6000,50", 600050], ["0", 0], ["1.01", 101], ["0,29", 29], ["21474836.47", 2147483647]])("converts %s into exact cents", (value, cents) => expect(priceToCents(value as string)).toBe(cents));
  it.each(["", "-1", "1.001", "6.000,50", "1e3", "1,", "21474836.48", "Infinity"])("rejects ambiguous or overflowing price %s", value => expect(priceToCents(value)).toBeNull());
  it("sends only editable fields and normalizes whitespace", () => {
    expect(toServiceWriteRequest({ ...baseline, name: " Corte ", category: " " })).toEqual({ name: "Corte", category: "", duration_minutes: 30, price_cents: 600050 });
  });
  it("only patches changes and clears categories with an empty string", () => {
    expect(changedServiceFields({ ...baseline, category: "" }, baseline)).toEqual({ category: "" });
    expect(changedServiceFields({ ...baseline, price: "6000.5" }, baseline)).toEqual({});
    expect(hasServiceFormChanges({ ...baseline, duration: "45" }, baseline)).toBe(true);
    expect(hasServiceFormChanges(baseline, baseline)).toBe(false);
  });
  it("validates required fields, lengths and integer duration", () => {
    expect(validateServiceForm({ name: " ", category: "x".repeat(101), duration: "1.5", price: "-1" })).toHaveProperty("name");
    for (const duration of ["0", "-1", "1.5", "1e2", "2147483648", ""]) expect(validateServiceForm({ ...baseline, duration })).toHaveProperty("duration");
    expect(validateServiceForm({ ...baseline, name: "x".repeat(101) })).toHaveProperty("name");
    expect(validateServiceForm({ ...baseline, price: "0" })).toEqual({});
  });
  it("maps API field errors in camelCase and snake_case", () => {
    const error = new ApiError("Validation", 400, { details: [{ field: "durationMinutes", message: "Duración inválida" }, { field: "price_cents", message: "Precio inválido" }, { field: "businessId", message: "Hidden" }] });
    expect(serviceApiFieldErrors(error)).toEqual({ duration: "Duración inválida", price: "Precio inválido" });
    expect(serviceApiFieldErrors(new Error())).toEqual({});
  });
});
