import { ApiError } from "@/lib/api/client";
import type { StaffMember, StaffMemberWriteRequest } from "./api";

export type StaffFormValues = { name: string; roleLabel: string; specialty: string; linkUser: boolean };
export type StaffFormField = keyof StaffFormValues;
export type StaffFormErrors = Partial<Record<StaffFormField, string>>;
export const staffFormFields: StaffFormField[] = ["name", "roleLabel", "specialty", "linkUser"];
export const emptyStaffForm: StaffFormValues = { name: "", roleLabel: "", specialty: "", linkUser: false };
export function toStaffFormValues(member: StaffMember): StaffFormValues {
  return { name: member.name, roleLabel: member.roleLabel ?? "", specialty: member.specialty ?? "", linkUser: false };
}
function normalized(values: StaffFormValues) {
  return { name: values.name.trim(), roleLabel: values.roleLabel.trim(), specialty: values.specialty.trim(), linkUser: values.linkUser };
}
export function hasStaffFormChanges(values: StaffFormValues, baseline: StaffFormValues) {
  const current = normalized(values), original = normalized(baseline);
  return staffFormFields.some(field => current[field] !== original[field]);
}
export function validateStaffForm(values: StaffFormValues, baseline?: StaffFormValues): StaffFormErrors {
  const current = normalized(values);
  const errors: StaffFormErrors = {};
  if (!current.name) errors.name = "Ingresá el nombre del profesional.";
  else if (current.name.length > 100) errors.name = "El nombre no puede superar los 100 caracteres.";
  if (current.roleLabel.length > 80) errors.roleLabel = "El rol no puede superar los 80 caracteres.";
  if (!current.specialty && (!baseline || baseline.specialty.trim())) errors.specialty = "Ingresá la especialidad.";
  else if (current.specialty.length > 150) errors.specialty = "La especialidad no puede superar los 150 caracteres.";
  return errors;
}
export function toStaffWriteRequest(values: StaffFormValues, userId: number): StaffMemberWriteRequest {
  const current = normalized(values);
  return { name: current.name, role_label: current.roleLabel, specialty: current.specialty, ...(current.linkUser ? { user_id: userId } : {}) };
}
export function changedStaffFields(values: StaffFormValues, baseline: StaffFormValues) {
  const current = normalized(values), original = normalized(baseline);
  const request: Partial<Omit<StaffMemberWriteRequest, "user_id">> = {};
  if (current.name !== original.name) request.name = current.name;
  if (current.roleLabel !== original.roleLabel) request.role_label = current.roleLabel;
  if (current.specialty !== original.specialty) request.specialty = current.specialty;
  return request;
}
export function staffApiFieldErrors(error: unknown): StaffFormErrors {
  if (!(error instanceof ApiError)) return {};
  if (error.code === "STAFF_USER_ALREADY_LINKED") return { linkUser: "Tu usuario ya está vinculado a un profesional, identificado con «Vos» en el listado. Editá ese perfil para actualizar tus datos." };
  if (!Array.isArray(error.details)) return {};
  const fields: Record<string, StaffFormField> = { name: "name", role_label: "roleLabel", roleLabel: "roleLabel", specialty: "specialty", user_id: "linkUser", userId: "linkUser" };
  const errors: StaffFormErrors = {};
  for (const detail of error.details) {
    if (detail && typeof detail.field === "string" && typeof detail.message === "string" && fields[detail.field]) errors[fields[detail.field]] = detail.message;
  }
  return errors;
}
