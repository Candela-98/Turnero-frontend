"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useId, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Button, FloatingAlert, Input, SaveChangesButton, Textarea } from "@/components/ui";
import { useFocusInvalidField } from "@/lib/forms/use-focus-invalid-field";
import { createCustomer, updateCustomer, type CustomerDetail, type CustomerWriteRequest } from "@/lib/customers/api";
import { changedCustomerFields, customerApiFieldErrors, customerFormFields, emptyCustomerForm, hasCustomerFormChanges, toCustomerFormValues, toCustomerWriteRequest, validateCustomerForm, type CustomerFormErrors, type CustomerFormField } from "@/lib/customers/form";
import { applyCustomerWrite, refreshCustomers } from "@/lib/customers/queries";

export type CustomerFormHandle = { hasChanges: () => boolean; isSaving: () => boolean };
type Props = {
  ref?: Ref<CustomerFormHandle>;
  footerTarget: HTMLElement | null;
  businessId: number;
  customer?: CustomerDetail;
  onSavingChange: (saving: boolean) => void;
  onSaved: (customer: CustomerDetail, refreshFailed: boolean) => void;
  onCancel: () => void;
};

export function CustomerForm({ ref, footerTarget, businessId, customer, onSavingChange, onSaved, onCancel }: Props) {
  const [baseline] = useState(() => customer ? toCustomerFormValues(customer) : emptyCustomerForm);
  const [values, setValues] = useState(baseline);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const sending = useRef(false);
  const id = useId();
  const focusInvalid = useFocusInvalidField();
  const client = useQueryClient();
  const hasChanges = hasCustomerFormChanges(values, baseline);
  const mutation = useMutation({ mutationFn: (request: Partial<CustomerWriteRequest>) => customer
    ? updateCustomer(customer.id, request) : createCustomer(request as CustomerWriteRequest), retry: false });
  useImperativeHandle(ref, () => ({ hasChanges: () => hasChanges, isSaving: () => sending.current }), [hasChanges]);

  function change(field: CustomerFormField, value: string) {
    setValues(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setSaveError(false);
  }
  function showErrors(next: CustomerFormErrors) {
    setErrors(next);
    const first = customerFormFields.find(field => next[field]);
    if (first) focusInvalid(`${id}-${first}`);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || (customer && !hasChanges)) return;
    const validation = validateCustomerForm(values, customer ? baseline : undefined);
    if (Object.keys(validation).length) { showErrors(validation); return; }
    sending.current = true; setIsSaving(true); onSavingChange(true); setSaveError(false); setErrors({});
    let saved: CustomerDetail;
    try {
      saved = await mutation.mutateAsync(customer ? changedCustomerFields(values, baseline) : toCustomerWriteRequest(values));
    } catch (error) {
      const fields = customerApiFieldErrors(error);
      if (Object.keys(fields).length) showErrors(fields);
      else setSaveError(true);
      sending.current = false; setIsSaving(false); onSavingChange(false);
      return;
    }
    let refreshFailed = false;
    try {
      await applyCustomerWrite(client, businessId, saved);
      await refreshCustomers(client, businessId, saved.id);
    } catch { refreshFailed = true; }
    sending.current = false; setIsSaving(false); onSavingChange(false);
    onSaved(saved, refreshFailed);
  }
  const controls = [
    { key: "name", label: "Nombre", type: "text", max: 100, autoComplete: "name" },
    { key: "phoneNumber", label: "Teléfono", type: "tel", max: 30, autoComplete: "tel" },
    { key: "email", label: "Email (opcional)", type: "email", max: 150, autoComplete: "email" },
  ] as const;
  const actions = <div className="w-full space-y-3">
    {saveError ? <FloatingAlert placement="dialog" title={customer ? "No pudimos guardar los cambios" : "No pudimos crear el cliente"} tone="error" dismissLabel="Cerrar error" onDismiss={() => setSaveError(false)}>
      <p>Revisá tu conexión e intentá nuevamente. Los datos que completaste se conservan.</p>
      <Button variant="ghost" form={`${id}-form`} type="submit" disabled={isSaving}>Reintentar</Button>
    </FloatingAlert> : null}
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" disabled={isSaving} onClick={onCancel}>Cancelar</Button>
      {customer ? <SaveChangesButton form={`${id}-form`} hasChanges={hasChanges} isSaving={isSaving} /> :
        <Button form={`${id}-form`} type="submit" disabled={isSaving}>{isSaving ? "Creando..." : "Crear cliente"}</Button>}
    </div>
  </div>;
  return <><form id={`${id}-form`} noValidate onSubmit={submit} className="space-y-4">
    <fieldset disabled={isSaving} className="space-y-4">
      {controls.map(({ key, label, type, max, autoComplete }) => <div key={key}>
        <label htmlFor={`${id}-${key}`} className="mb-2 block text-sm font-medium text-on-surface-variant">{label}</label>
        <Input id={`${id}-${key}`} type={type} autoComplete={autoComplete} value={values[key]} maxLength={max}
          required={key === "name" || key === "phoneNumber" && (!customer || Boolean(baseline.phoneNumber.trim()))}
          onChange={event => change(key, event.target.value)} aria-invalid={Boolean(errors[key])}
          aria-describedby={[errors[key] ? `${id}-${key}-error` : "", key === "phoneNumber" && customer && !baseline.phoneNumber.trim() ? `${id}-phone-hint` : ""].filter(Boolean).join(" ") || undefined} />
        {key === "phoneNumber" && customer && !baseline.phoneNumber.trim() ? <p id={`${id}-phone-hint`} className="mt-2 text-xs text-on-surface-variant">Este cliente todavía no tiene teléfono. Podés completarlo ahora o editar el resto de la información.</p> : null}
        {errors[key] ? <p id={`${id}-${key}-error`} role="alert" className="mt-2 text-sm text-error">{errors[key]}</p> : null}
      </div>)}
      <div>
        <label htmlFor={`${id}-internalNotes`} className="mb-2 block text-sm font-medium text-on-surface-variant">Notas internas (opcional)</label>
        <Textarea id={`${id}-internalNotes`} value={values.internalNotes} maxLength={2000} onChange={event => change("internalNotes", event.target.value)}
          aria-invalid={Boolean(errors.internalNotes)} aria-describedby={`${id}-notes-hint${errors.internalNotes ? ` ${id}-internalNotes-error` : ""}`} />
        <p id={`${id}-notes-hint`} className="mt-2 text-xs text-on-surface-variant">Información interna del negocio; no se muestra al cliente.</p>
        {errors.internalNotes ? <p id={`${id}-internalNotes-error`} role="alert" className="mt-2 text-sm text-error">{errors.internalNotes}</p> : null}
      </div>
    </fieldset>
  </form>{footerTarget ? createPortal(actions, footerTarget) : null}</>;
}
