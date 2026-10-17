"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useId, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Button, FloatingAlert, InlineAlert, Input, SaveChangesButton, Switch } from "@/components/ui";
import { useFocusInvalidField } from "@/lib/forms/use-focus-invalid-field";
import { createStaffMember, updateStaffMember, type StaffMember, type StaffMemberWriteRequest } from "@/lib/staff-members/api";
import { changedStaffFields, emptyStaffForm, hasStaffFormChanges, staffApiFieldErrors, staffFormFields, toStaffFormValues, toStaffWriteRequest, validateStaffForm, type StaffFormErrors, type StaffFormField } from "@/lib/staff-members/form";
import { refreshStaffMembers, staffMemberKeys } from "@/lib/staff-members/queries";

export type StaffFormHandle = { hasChanges: () => boolean; isSaving: () => boolean };
type Props = {
  ref?: Ref<StaffFormHandle>;
  footerTarget: HTMLElement | null;
  businessId: number;
  userId: number;
  member?: StaffMember;
  linkedMember?: StaffMember | null;
  checkingLink: boolean;
  linkError: boolean;
  onRetryLink: () => void;
  onSavingChange: (saving: boolean) => void;
  onSaved: (member: StaffMember, refreshFailed: boolean) => void;
  onCancel: () => void;
};

export function StaffMemberForm({ ref, footerTarget, businessId, userId, member, linkedMember, checkingLink, linkError, onRetryLink, onSavingChange, onSaved, onCancel }: Props) {
  const [baseline] = useState(() => member ? toStaffFormValues(member) : emptyStaffForm);
  const [values, setValues] = useState(baseline);
  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const sending = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const id = useId();
  const focusInvalid = useFocusInvalidField();
  const client = useQueryClient();
  const linkUnavailable = checkingLink || linkError || Boolean(linkedMember);
  const hasChanges = hasStaffFormChanges(values, baseline);
  const mutation = useMutation({
    mutationFn: (request: StaffMemberWriteRequest | Partial<Omit<StaffMemberWriteRequest, "user_id">>) => member
      ? updateStaffMember(member.id, request) : createStaffMember(request as StaffMemberWriteRequest),
    retry: false,
  });
  useImperativeHandle(ref, () => ({ hasChanges: () => hasChanges, isSaving: () => sending.current }), [hasChanges]);
  function change(field: StaffFormField, value: string | boolean) {
    setValues(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setSaveError(null);
  }
  function showErrors(next: StaffFormErrors) {
    setErrors(next);
    const first = staffFormFields.find(field => next[field]);
    if (first) focusInvalid(`${id}-${first}`);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || (member && !hasChanges)) return;
    if (!member && values.linkUser && linkUnavailable) {
      setValues(current => ({ ...current, linkUser: false }));
      showErrors({ linkUser: "No se puede vincular este profesional con tu usuario. Revisá la información de vinculación." });
      return;
    }
    const validation = validateStaffForm(values, member ? baseline : undefined);
    if (Object.keys(validation).length) { showErrors(validation); return; }
    sending.current = true;
    setIsSaving(true);
    onSavingChange(true);
    setSaveError(null);
    setErrors({});
    let saved: StaffMember;
    try {
      saved = await mutation.mutateAsync(member ? changedStaffFields(values, baseline) : toStaffWriteRequest(values, userId));
    } catch (error) {
      const fields = staffApiFieldErrors(error);
      if (fields.linkUser) {
        setValues(current => ({ ...current, linkUser: false }));
        void client.invalidateQueries({ queryKey: staffMemberKeys.userLink(businessId, userId), exact: true });
      }
      if (Object.keys(fields).length) showErrors(fields);
      else setSaveError("No pudimos guardar el profesional. Revisá tu conexión e intentá nuevamente.");
      sending.current = false;
      setIsSaving(false);
      onSavingChange(false);
      return;
    }
    await Promise.all([
      client.cancelQueries({ queryKey: staffMemberKeys.all(businessId) }),
      client.cancelQueries({ queryKey: staffMemberKeys.detail(businessId, saved.id), exact: true }),
    ]);
    client.setQueryData(staffMemberKeys.detail(businessId, saved.id), saved);
    let refreshFailed = false;
    try { await refreshStaffMembers(client, businessId, saved.id); }
    catch { refreshFailed = true; }
    sending.current = false;
    setIsSaving(false);
    onSavingChange(false);
    onSaved(saved, refreshFailed);
  }
  const fields = [
    { key: "name", label: "Nombre", max: 100 },
    { key: "roleLabel", label: "Rol (opcional)", max: 80 },
    { key: "specialty", label: "Especialidad", max: 150 },
  ] as const;
  const actions = <div className="w-full space-y-3">
    {saveError ? <FloatingAlert placement="dialog" title="No pudimos guardar" tone="error" dismissLabel="Cerrar error" onDismiss={() => setSaveError(null)}>{saveError}</FloatingAlert> : null}
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" disabled={isSaving} onClick={onCancel}>Cancelar</Button>
      {member ? <SaveChangesButton form={`${id}-form`} hasChanges={hasChanges} isSaving={isSaving} /> : <Button form={`${id}-form`} type="submit" disabled={isSaving}>{isSaving ? "Creando..." : "Crear profesional"}</Button>}
    </div>
  </div>;
  return <><form id={`${id}-form`} noValidate onSubmit={submit} className="space-y-4">
    {member?.userId === userId ? <InlineAlert title="Tu perfil profesional">Este profesional está vinculado a tu usuario. Podés actualizar sus datos desde este formulario.</InlineAlert> : null}
    {!member ? <p className="text-sm text-on-surface-variant">Al crear el profesional, sus horarios iniciales se copian de los horarios del negocio.</p> : null}
    <fieldset disabled={isSaving} className="space-y-4">
      {fields.map(({ key, label, max }) => <div key={key}>
        <label htmlFor={`${id}-${key}`} className="mb-2 block text-sm font-medium text-on-surface-variant">{label}</label>
        <Input id={`${id}-${key}`} value={values[key]} maxLength={max} onChange={event => change(key, event.target.value)}
          aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${id}-${key}-error` : undefined} />
        {errors[key] ? <p id={`${id}-${key}-error`} role="alert" className="mt-2 text-sm text-error">{errors[key]}</p> : null}
      </div>)}
      {!member ? <div>
        <label htmlFor={`${id}-linkUser`} className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm font-medium text-on-surface-variant">
          Este profesional soy yo
          <Switch id={`${id}-linkUser`} checked={values.linkUser && !linkUnavailable} disabled={linkUnavailable} onCheckedChange={checked => { if (!linkUnavailable) change("linkUser", checked); }} aria-invalid={Boolean(errors.linkUser)} aria-describedby={`${id}-linkUser-hint${errors.linkUser ? ` ${id}-linkUser-error` : ""}`} />
        </label>
        <p id={`${id}-linkUser-hint`} aria-live="polite" className="mt-1 break-words text-xs text-on-surface-variant">
          {checkingLink ? "Comprobando tu vinculación…" : linkedMember ? `Ya estás vinculado a ${linkedMember.name}. Podés editar tu perfil, marcado como «Vos», desde el listado.` : linkError ? "No pudimos comprobar si tu usuario ya tiene un profesional vinculado." : "Vincula este profesional con tu usuario actual."}
        </p>
        {linkError && !checkingLink ? <Button variant="ghost" size="sm" onClick={onRetryLink}>Reintentar comprobación</Button> : null}
        {errors.linkUser ? <p id={`${id}-linkUser-error`} role="alert" className="mt-2 text-sm text-error">{errors.linkUser}</p> : null}
      </div> : null}
    </fieldset>
  </form>{footerTarget ? createPortal(actions, footerTarget) : null}</>;
}
