import { expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { changedCustomerFields, customerApiFieldErrors, emptyCustomerForm, hasCustomerFormChanges, toCustomerFormValues, toCustomerWriteRequest, validateCustomerForm } from "./form";

const values = { name: " Ana ", phoneNumber: " +54 (11) 123 ", email: " ana@example.com ", internalNotes: " Nota\nprivada " };
it("serializes only editable fields and trims without changing phone format or note line breaks", () => {
  expect(toCustomerWriteRequest(values)).toEqual({ name: "Ana", phone_number: "+54 (11) 123", email: "ana@example.com", internal_notes: "Nota\nprivada" });
  expect(toCustomerFormValues({ id: 1, name: "Ana", phoneNumber: null, email: null, internalNotes: null, status: "INACTIVE" }))
    .toEqual({ name: "Ana", phoneNumber: "", email: "", internalNotes: "" });
});
it("requires name and phone on create, accepts optional email and enforces all limits", () => {
  expect(validateCustomerForm(emptyCustomerForm)).toEqual({ name: "Ingresá el nombre del cliente.", phoneNumber: "Ingresá el teléfono del cliente." });
  expect(validateCustomerForm({ ...values, email: "", internalNotes: "" })).toEqual({});
  expect(validateCustomerForm({ ...values, email: "bad" })).toHaveProperty("email");
  expect(Object.keys(validateCustomerForm({ name: "n".repeat(101), phoneNumber: "1".repeat(31), email: "e".repeat(151), internalNotes: "n".repeat(2001) }))).toEqual(["name", "phoneNumber", "email", "internalNotes"]);
  expect(validateCustomerForm({ name: "n".repeat(100), phoneNumber: "1".repeat(30), email: "", internalNotes: "n".repeat(2000) })).toEqual({});
});
it("lets legacy customers without a phone edit other fields but prevents removing an existing phone", () => {
  const baseline = { ...emptyCustomerForm, name: "Ana" };
  expect(validateCustomerForm({ ...baseline, internalNotes: "Nueva nota" }, baseline)).toEqual({});
  expect(changedCustomerFields({ ...baseline, internalNotes: "Nueva nota" }, baseline)).toEqual({ internal_notes: "Nueva nota" });
  expect(validateCustomerForm({ ...values, phoneNumber: "" }, values)).toHaveProperty("phoneNumber");
});
it("detects edits and reversions and sends empty strings to clear optional fields", () => {
  expect(hasCustomerFormChanges({ ...values, name: "Ana" }, values)).toBe(false);
  expect(hasCustomerFormChanges({ ...values, name: "Bruno" }, values)).toBe(true);
  expect(changedCustomerFields({ ...values, email: "", internalNotes: "" }, values)).toEqual({ email: "", internal_notes: "" });
});
it("maps backend field variants to Spanish messages and keeps general failures out of field errors", () => {
  const error = new ApiError("Validation", 400, { details: [{ field: "phoneNumber", message: "Invalid phone" }, { field: "internal_notes", message: "Too long" }, { field: "status" }] });
  expect(customerApiFieldErrors(error)).toEqual({ phoneNumber: "Revisá el teléfono ingresado (hasta 30 caracteres).", internalNotes: "Las notas no pueden superar los 2000 caracteres." });
  expect(customerApiFieldErrors(new Error("Offline"))).toEqual({});
});
