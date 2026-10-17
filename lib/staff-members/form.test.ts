import { expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { changedStaffFields, emptyStaffForm, hasStaffFormChanges, staffApiFieldErrors, toStaffFormValues, toStaffWriteRequest, validateStaffForm } from "./form";
import type { StaffMember } from "./api";

const member: StaffMember = { id: 2, userId: 3, name: "Ana", roleLabel: "Barbera", specialty: "Color", avatarUrl: "https://example.com/a.png", status: "INACTIVE" };
const baseline = toStaffFormValues(member);
it("enforces required fields and actual API/database boundaries", () => {
  expect(validateStaffForm(emptyStaffForm)).toEqual({ name: expect.any(String), specialty: expect.any(String) });
  expect(validateStaffForm({ name: "x".repeat(100), roleLabel: "x".repeat(80), specialty: "x".repeat(150), linkUser: false })).toEqual({});
  expect(Object.keys(validateStaffForm({ name: "x".repeat(101), roleLabel: "x".repeat(81), specialty: "x".repeat(151), linkUser: false }))).toEqual(["name", "roleLabel", "specialty"]);
});
it("creates only editable fields and optionally links the current user", () => {
  expect(toStaffWriteRequest({ ...baseline, name: " Ana ", linkUser: false }, 5)).toEqual({ name: "Ana", role_label: "Barbera", specialty: "Color" });
  expect(toStaffWriteRequest({ ...baseline, linkUser: true }, 5)).toEqual({ name: "Ana", role_label: "Barbera", specialty: "Color", user_id: 5 });
});
it("patches only changed fields, clears optional role, and detects reversal", () => {
  expect(changedStaffFields({ ...baseline, roleLabel: " " }, baseline)).toEqual({ role_label: "" });
  expect(hasStaffFormChanges({ ...baseline, name: "Otro" }, baseline)).toBe(true);
  expect(hasStaffFormChanges({ ...baseline, name: " Ana " }, baseline)).toBe(false);
  expect(changedStaffFields(baseline, baseline)).toEqual({});
  expect(validateStaffForm({ ...baseline, specialty: " " }, baseline).specialty).toBeTruthy();
});
it("can edit legacy null specialties without sending or requiring them", () => {
  const legacy = toStaffFormValues({ ...member, specialty: null, roleLabel: null });
  expect(validateStaffForm({ ...legacy, name: "Otra" }, legacy)).toEqual({});
  expect(changedStaffFields({ ...legacy, name: "Otra" }, legacy)).toEqual({ name: "Otra" });
});
it("maps both API field conventions and the duplicate-user conflict", () => {
  expect(staffApiFieldErrors(new ApiError("Conflict", 409, { code: "STAFF_USER_ALREADY_LINKED" })).linkUser).toContain("ya está vinculado");
  for (const field of ["roleLabel", "role_label"]) {
    expect(staffApiFieldErrors(new ApiError("Invalid", 400, { details: [{ field, message: "Too long" }] }))).toEqual({ roleLabel: "Too long" });
  }
  expect(staffApiFieldErrors(new Error("offline"))).toEqual({});
});
