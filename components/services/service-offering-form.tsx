"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useId, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Button, FloatingAlert, Input, SaveChangesButton } from "@/components/ui";
import { useFocusInvalidField } from "@/lib/forms/use-focus-invalid-field";
import { createServiceOffering, updateServiceOffering, type ServiceOffering, type ServiceOfferingWriteRequest } from "@/lib/service-offerings/api";
import { changedServiceFields, emptyServiceForm, hasServiceFormChanges, serviceApiFieldErrors, serviceFormFields, toServiceFormValues, toServiceWriteRequest, validateServiceForm, type ServiceFormErrors, type ServiceFormField } from "@/lib/service-offerings/form";
import { refreshServiceCatalog, serviceOfferingKeys } from "@/lib/service-offerings/queries";

export type ServiceFormHandle = { hasChanges: () => boolean; isSaving: () => boolean };
export type ServiceOfferingFormProps = {
  ref?: Ref<ServiceFormHandle>;
  footerTarget?: HTMLElement | null;
  businessId: number;
  service?: ServiceOffering;
  categories: string[];
  onSavingChange: (saving: boolean) => void;
  onSaved: (service: ServiceOffering, refreshFailed: boolean) => void;
  onCancel: () => void;
};

export function ServiceOfferingForm({ ref, footerTarget, businessId, service, categories, onSavingChange, onSaved, onCancel }: ServiceOfferingFormProps) {
  const [baseline] = useState(() => service ? toServiceFormValues(service) : emptyServiceForm);
  const [values, setValues] = useState(baseline);
  const [errors, setErrors] = useState<ServiceFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const sending = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const id = useId();
  const focusInvalid = useFocusInvalidField();
  const client = useQueryClient();
  const hasChanges = hasServiceFormChanges(values, baseline);
  const mutation = useMutation({
    mutationFn: (request: ServiceOfferingWriteRequest | Partial<ServiceOfferingWriteRequest>) => service
      ? updateServiceOffering(service.id, request)
      : createServiceOffering(request as ServiceOfferingWriteRequest),
  });
  useImperativeHandle(ref, () => ({ hasChanges: () => hasChanges, isSaving: () => sending.current }), [hasChanges]);

  function change(field: ServiceFormField, value: string) {
    setValues(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setSaveError(null);
  }
  function showErrors(next: ServiceFormErrors) {
    setErrors(next);
    const first = serviceFormFields.find(field => next[field]);
    if (first) focusInvalid(`${id}-${first}`);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || (service && !hasChanges)) return;
    const validation = validateServiceForm(values);
    if (Object.keys(validation).length) { showErrors(validation); return; }
    sending.current = true;
    setIsSaving(true);
    onSavingChange(true);
    setSaveError(null);
    setErrors({});
    let saved: ServiceOffering;
    try {
      saved = await mutation.mutateAsync(service ? changedServiceFields(values, baseline) : toServiceWriteRequest(values));
    } catch (error) {
      const fields = serviceApiFieldErrors(error);
      if (Object.keys(fields).length) showErrors(fields);
      else setSaveError("No pudimos guardar el servicio. Revisá tu conexión e intentá nuevamente.");
      sending.current = false;
      setIsSaving(false);
      onSavingChange(false);
      return;
    }
    client.setQueryData(serviceOfferingKeys.detail(businessId, saved.id), saved);
    let refreshFailed = false;
    try { await refreshServiceCatalog(client, businessId, saved.id); }
    catch { refreshFailed = true; }
    sending.current = false;
    setIsSaving(false);
    onSavingChange(false);
    onSaved(saved, refreshFailed);
  }
  const fields: { key: ServiceFormField; label: string; hint?: string }[] = [
    { key: "name", label: "Nombre" },
    { key: "category", label: "Categoría (opcional)" },
    { key: "duration", label: "Duración (minutos)" },
    { key: "price", label: "Precio (ARS)", hint: "En pesos, sin separadores de miles. Ejemplo: 6000,50." },
  ];
  const actions = <div className="w-full space-y-3">
    {saveError ? <FloatingAlert placement="dialog" title="No pudimos guardar" tone="error" dismissLabel="Cerrar error" onDismiss={() => setSaveError(null)}>{saveError}</FloatingAlert> : null}
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" disabled={isSaving} onClick={onCancel}>Cancelar</Button>
      {service ? <SaveChangesButton form={`${id}-form`} hasChanges={hasChanges} isSaving={isSaving} /> : <Button form={`${id}-form`} type="submit" disabled={isSaving}>{isSaving ? "Creando..." : "Crear servicio"}</Button>}
    </div>
  </div>;
  return <><form id={`${id}-form`} noValidate onSubmit={submit} className="space-y-4">
    <fieldset disabled={isSaving} className="space-y-4">
      {fields.map(({ key, label, hint }) => <div key={key}>
        <label htmlFor={`${id}-${key}`} className="mb-2 block text-sm font-medium text-on-surface-variant">{label}</label>
        <Input id={`${id}-${key}`} value={values[key]} onChange={event => change(key, event.target.value)}
          maxLength={key === "name" || key === "category" ? 100 : undefined}
          inputMode={key === "duration" ? "numeric" : key === "price" ? "decimal" : undefined}
          list={key === "category" ? `${id}-categories` : undefined}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={[hint ? `${id}-${key}-hint` : "", errors[key] ? `${id}-${key}-error` : ""].filter(Boolean).join(" ") || undefined} />
        {hint ? <p id={`${id}-${key}-hint`} className="mt-1 text-xs text-on-surface-variant">{hint}</p> : null}
        {errors[key] ? <p id={`${id}-${key}-error`} role="alert" className="mt-2 text-sm text-error">{errors[key]}</p> : null}
      </div>)}
      <datalist id={`${id}-categories`}>{categories.map(category => <option key={category} value={category} />)}</datalist>
    </fieldset>
    {footerTarget === undefined ? actions : null}
  </form>{footerTarget ? createPortal(actions, footerTarget) : null}</>;
}
