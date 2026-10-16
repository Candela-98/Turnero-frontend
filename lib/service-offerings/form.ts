import { ApiError } from "@/lib/api/client";
import type { ServiceOffering, ServiceOfferingWriteRequest } from "./api";

export type ServiceFormValues = { name: string; category: string; duration: string; price: string };
export type ServiceFormField = keyof ServiceFormValues;
export type ServiceFormErrors = Partial<Record<ServiceFormField, string>>;
export const serviceFormFields: ServiceFormField[] = ["name", "category", "duration", "price"];
export const emptyServiceForm: ServiceFormValues = { name: "", category: "", duration: "", price: "" };
const maxInt = 2_147_483_647;

/** Decimal pesos without thousands separators; integer cents avoid binary rounding. */
export function priceToCents(value: string): number | null {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= maxInt ? cents : null;
}

export function toServiceFormValues(service: ServiceOffering): ServiceFormValues {
  return {
    name: service.name, category: service.category ?? "", duration: String(service.durationMinutes),
    price: `${Math.floor(service.priceCents / 100)},${String(service.priceCents % 100).padStart(2, "0")}`,
  };
}

export function validateServiceForm(values: ServiceFormValues): ServiceFormErrors {
  const errors: ServiceFormErrors = {};
  if (!values.name.trim()) errors.name = "Ingresá el nombre del servicio.";
  else if (values.name.trim().length > 100) errors.name = "El nombre no puede superar los 100 caracteres.";
  if (values.category.trim().length > 100) errors.category = "La categoría no puede superar los 100 caracteres.";
  if (!/^\d+$/.test(values.duration.trim()) || Number(values.duration) < 1 || Number(values.duration) > maxInt) {
    errors.duration = "Ingresá una duración válida en minutos enteros, mayor que cero.";
  }
  if (priceToCents(values.price) === null) errors.price = "Ingresá un precio válido, mayor o igual a cero, con hasta dos decimales y sin separadores de miles.";
  return errors;
}

export function toServiceWriteRequest(values: ServiceFormValues): ServiceOfferingWriteRequest {
  if (Object.keys(validateServiceForm(values)).length) throw new Error("Invalid service form");
  return { name: values.name.trim(), category: values.category.trim(), duration_minutes: Number(values.duration), price_cents: priceToCents(values.price)! };
}

export function changedServiceFields(values: ServiceFormValues, baseline: ServiceFormValues): Partial<ServiceOfferingWriteRequest> {
  const current = toServiceWriteRequest(values);
  const original = { name: baseline.name.trim(), category: baseline.category.trim(), duration_minutes: Number(baseline.duration), price_cents: priceToCents(baseline.price) };
  return Object.fromEntries(Object.entries(current).filter(([key, value]) => value !== original[key as keyof ServiceOfferingWriteRequest]));
}

export function hasServiceFormChanges(values: ServiceFormValues, baseline: ServiceFormValues): boolean {
  if (Object.keys(validateServiceForm(values)).length || Object.keys(validateServiceForm(baseline)).length) {
    return serviceFormFields.some(field => values[field] !== baseline[field]);
  }
  return Object.keys(changedServiceFields(values, baseline)).length > 0;
}

export function serviceApiFieldErrors(error: unknown): ServiceFormErrors {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {};
  const fields: Record<string, ServiceFormField> = { name: "name", category: "category", duration_minutes: "duration", durationMinutes: "duration", price_cents: "price", priceCents: "price" };
  const errors: ServiceFormErrors = {};
  for (const detail of error.details) {
    if (detail && typeof detail === "object" && typeof detail.field === "string" && typeof detail.message === "string" && fields[detail.field]) errors[fields[detail.field]] = detail.message;
  }
  return errors;
}
