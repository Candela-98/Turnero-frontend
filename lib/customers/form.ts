import { ApiError } from "@/lib/api/client";
import type { CustomerDetail, CustomerWriteRequest } from "./api";

export type CustomerFormValues = { name: string; phoneNumber: string; email: string; internalNotes: string };
export type CustomerFormField = keyof CustomerFormValues;
export type CustomerFormErrors = Partial<Record<CustomerFormField, string>>;
export const customerFormFields: CustomerFormField[] = ["name", "phoneNumber", "email", "internalNotes"];
export const emptyCustomerForm: CustomerFormValues = { name: "", phoneNumber: "", email: "", internalNotes: "" };
export function toCustomerFormValues(customer: CustomerDetail): CustomerFormValues {
  return { name: customer.name, phoneNumber: customer.phoneNumber ?? "", email: customer.email ?? "", internalNotes: customer.internalNotes ?? "" };
}
export function toCustomerWriteRequest(values: CustomerFormValues): CustomerWriteRequest {
  return { name: values.name.trim(), phone_number: values.phoneNumber.trim(), email: values.email.trim(), internal_notes: values.internalNotes.trim() };
}
export function changedCustomerFields(values: CustomerFormValues, baseline: CustomerFormValues): Partial<CustomerWriteRequest> {
  const current = toCustomerWriteRequest(values), previous = toCustomerWriteRequest(baseline);
  return Object.fromEntries(Object.entries(current).filter(([key, value]) => value !== previous[key as keyof CustomerWriteRequest]));
}
export function hasCustomerFormChanges(values: CustomerFormValues, baseline: CustomerFormValues) {
  return Object.keys(changedCustomerFields(values, baseline)).length > 0;
}
export function validateCustomerForm(values: CustomerFormValues, baseline?: CustomerFormValues): CustomerFormErrors {
  const current = toCustomerWriteRequest(values);
  const errors: CustomerFormErrors = {};
  if (!current.name) errors.name = "Ingresá el nombre del cliente.";
  else if (current.name.length > 100) errors.name = "El nombre no puede superar los 100 caracteres.";
  if (!current.phone_number && (!baseline || baseline.phoneNumber.trim())) errors.phoneNumber = "Ingresá el teléfono del cliente.";
  else if (current.phone_number.length > 30) errors.phoneNumber = "El teléfono no puede superar los 30 caracteres.";
  if (current.email.length > 150) errors.email = "El email no puede superar los 150 caracteres.";
  else if (current.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email)) errors.email = "Ingresá un email válido.";
  if (current.internal_notes.length > 2000) errors.internalNotes = "Las notas no pueden superar los 2000 caracteres.";
  return errors;
}
export function customerApiFieldErrors(error: unknown): CustomerFormErrors {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {};
  const fields: Record<string, CustomerFormField> = { name: "name", phone: "phoneNumber", phone_number: "phoneNumber", phoneNumber: "phoneNumber", email: "email", internal_notes: "internalNotes", internalNotes: "internalNotes" };
  const messages: Record<CustomerFormField, string> = { name: "Revisá el nombre ingresado (hasta 100 caracteres).", phoneNumber: "Revisá el teléfono ingresado (hasta 30 caracteres).", email: "Ingresá un email válido de hasta 150 caracteres.", internalNotes: "Las notas no pueden superar los 2000 caracteres." };
  const errors: CustomerFormErrors = {};
  for (const detail of error.details) {
    if (detail && typeof detail.field === "string" && fields[detail.field]) {
      const field = fields[detail.field]; errors[field] = messages[field];
    }
  }
  return errors;
}
