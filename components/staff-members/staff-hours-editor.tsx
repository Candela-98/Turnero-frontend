"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useImperativeHandle, useRef, useState, useId, type Ref } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, ConfirmDiscardDialog, FloatingAlert, InlineAlert, ResponsiveDialog, SaveChangesButton, Skeleton } from "@/components/ui";
import { WeeklyDayRow } from "@/components/ui/weekly-day-row";
import { ApiError } from "@/lib/api/client";
import { getBusinessHours, toBusinessHoursFormValues, type BusinessHoursDayFormValues } from "@/lib/business-hours";
import { useFocusInvalidField } from "@/lib/forms/use-focus-invalid-field";
import type { StaffMember } from "@/lib/staff-members/api";
import { getStaffHours, replaceStaffHours, sameStaffHours, staffHoursHints, staffHoursKey, toStaffHours, validateStaffHours, type StaffHoursDay, type StaffHoursErrors } from "@/lib/staff-members/hours";
import { staffMemberKeys } from "@/lib/staff-members/queries";
import { weekDayLabels } from "@/lib/weekly-hours";

type Handle = { hasChanges: () => boolean; isSaving: () => boolean };
type Props = { member: StaffMember | null; onClose: () => void; onSaved: () => void };
export function StaffHoursEditor({ member, onClose, onSaved }: Props) {
  const { business } = useAuth();
  const form = useRef<Handle>(null);
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [footer, setFooter] = useState<HTMLDivElement | null>(null);
  function close() {
    if (form.current?.isSaving()) return;
    if (form.current?.hasChanges()) setDiscard(true);
    else onClose();
  }
  return <>
    <ResponsiveDialog open={Boolean(member)} onOpenChange={next => { if (!next) close(); }} title="Horarios del profesional"
      description={member ? `Definí la semana laboral de ${member.name}.` : "Definí su semana laboral."}
      closeLabel="Cerrar horarios" closeDisabled={saving} footer={<div className="w-full" ref={setFooter} />}>
      {member && business ? <HoursContent key={member.id} businessId={business.id} staffId={member.id} formRef={form} footer={footer} onSaving={setSaving} onClose={close} onSaved={() => { onClose(); onSaved(); }} /> : null}
    </ResponsiveDialog>
    <ConfirmDiscardDialog open={discard} onOpenChange={setDiscard} onDiscard={() => { setDiscard(false); onClose(); }} />
  </>;
}
function HoursContent({ businessId, staffId, formRef, ...props }: {
  businessId: number; staffId: number; formRef: Ref<Handle>; footer: HTMLElement | null;
  onSaving: (saving: boolean) => void; onClose: () => void; onSaved: () => void;
}) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: staffHoursKey(businessId, staffId), queryFn: ({ signal }) => getStaffHours(staffId, signal),
    staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false, retry: false });
  const businessHours = useQuery({ queryKey: ["business-hours", businessId],
    queryFn: async ({ signal }) => toBusinessHoursFormValues(await getBusinessHours(signal)).days,
    staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false, retry: false });
  const [initial, setInitial] = useState<StaffHoursDay[] | null>(null);
  if (initial === null && query.isSuccess && !query.isFetching && query.isFetchedAfterMount) setInitial(query.data);
  if (initial) return <HoursForm {...props} ref={formRef} businessId={businessId} staffId={staffId} initial={initial}
    businessDays={businessHours.isSuccess && !businessHours.isFetching && businessHours.isFetchedAfterMount ? businessHours.data : undefined}
    checkingBusiness={businessHours.isFetching || businessHours.isPending} businessFailed={businessHours.isError}
    onRetryBusiness={() => void businessHours.refetch()} />;
  if (query.isFetching || query.isPending) return <div role="status" aria-label="Cargando horarios del profesional"><Skeleton className="h-48 w-full" /></div>;
  const missing = query.error instanceof ApiError && query.error.status === 404;
  return <InlineAlert tone="error" title={missing ? "El profesional ya no está disponible" : "No pudimos cargar los horarios"}>
    {missing ? <Button variant="ghost" onClick={() => { void client.invalidateQueries({ queryKey: staffMemberKeys.all(businessId) }); props.onClose(); }}>Volver al listado</Button>
      : <Button variant="ghost" onClick={() => void query.refetch()}>Reintentar carga</Button>}
  </InlineAlert>;
}
function HoursForm({ ref, businessId, staffId, initial, footer, onSaving, onClose, onSaved, businessDays, checkingBusiness, businessFailed, onRetryBusiness }: {
  ref: Ref<Handle>; businessId: number; staffId: number; initial: StaffHoursDay[]; footer: HTMLElement | null;
  onSaving: (saving: boolean) => void; onClose: () => void; onSaved: () => void;
  businessDays?: BusinessHoursDayFormValues[]; checkingBusiness: boolean; businessFailed: boolean; onRetryBusiness: () => void;
}) {
  const [baseline] = useState(initial);
  const [days, setDays] = useState(initial);
  const [errors, setErrors] = useState<StaffHoursErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const sending = useRef(false);
  const client = useQueryClient();
  const id = useId();
  const focusInvalid = useFocusInvalidField();
  const dirty = !sameStaffHours(days, baseline) && !confirmed;
  useImperativeHandle(ref, () => ({ hasChanges: () => dirty, isSaving: () => sending.current }), [dirty]);
  function change(day: StaffHoursDay) {
    setDays(current => current.map(item => item.dayOfWeek === day.dayOfWeek ? day : item));
    setErrors(current => ({ ...current, [day.dayOfWeek]: undefined })); setFormError(null); setSaveError(null);
  }
  function busy(value: boolean) { sending.current = value; setSaving(value); onSaving(value); }
  async function finish(saved: StaffHoursDay[]) {
    await client.cancelQueries({ queryKey: staffHoursKey(businessId, staffId), exact: true });
    client.setQueryData(staffHoursKey(businessId, staffId), saved);
    busy(false); onSaved();
  }
  async function retryRead() {
    if (sending.current) return;
    busy(true);
    try { await finish(await getStaffHours(staffId)); }
    catch { busy(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || !dirty || confirmed) return;
    const validation = validateStaffHours(days);
    setErrors(validation.days); setFormError(validation.form ?? null);
    const first = days.find(day => validation.days[day.dayOfWeek]);
    if (validation.form || first) {
      if (first) focusInvalid(`${id}-${first.dayOfWeek.toLowerCase()}-${validation.days[first.dayOfWeek]?.start ? "starts-at" : "ends-at"}`);
      return;
    }
    busy(true); setSaveError(null);
    let response;
    try { response = await replaceStaffHours(staffId, days); }
    catch (error) {
      setSaveError(error instanceof ApiError && error.status === 404 ? "El profesional ya no está disponible. Volvé al listado para actualizar los datos." : "No pudimos guardar los horarios. Tus cambios se conservan; intentá nuevamente.");
      busy(false); return;
    }
    setConfirmed(true);
    try { await finish(toStaffHours(response)); }
    catch { busy(false); }
  }
  const actions = <div className="w-full space-y-3">
    {confirmed && !saving ? <InlineAlert tone="error" title="Los horarios se guardaron">No pudimos actualizar la lectura. <Button variant="ghost" onClick={() => void retryRead()}>Reintentar actualización</Button></InlineAlert> : null}
    {saveError ? <FloatingAlert placement="dialog" tone="error" title="No pudimos guardar los horarios" dismissLabel="Cerrar error" onDismiss={() => setSaveError(null)}><p>{saveError}</p><Button variant="ghost" size="sm" type="submit" form={id}>Reintentar guardado</Button></FloatingAlert> : null}
    <div className="flex items-center justify-between gap-3"><Button variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><SaveChangesButton form={id} hasChanges={dirty} isSaving={saving} /></div>
  </div>;
  return <><form id={id} noValidate onSubmit={submit} className="space-y-4">
    <p className="text-sm text-on-surface-variant">La disponibilidad efectiva se limita también a los horarios del negocio. Estos cambios no modifican los turnos existentes.</p>
    {checkingBusiness ? <p role="status" className="text-sm text-on-surface-variant">Consultando los horarios del negocio…</p> : null}
    {businessFailed && !checkingBusiness ? <InlineAlert title="No pudimos comparar con los horarios del negocio">Podés guardar; las reservas seguirán limitadas por los horarios del negocio. <Button variant="ghost" onClick={onRetryBusiness}>Reintentar comparación</Button></InlineAlert> : null}
    {!days.some(day => day.isAvailable) ? <InlineAlert title="No hay días disponibles">Activá los días en los que atiende este profesional.</InlineAlert> : null}
    {formError ? <InlineAlert title="Revisá la semana" tone="error">{formError}</InlineAlert> : null}
    <fieldset disabled={saving || confirmed} className="min-w-0 space-y-3">
      {days.map(day => <WeeklyDayRow key={day.dayOfWeek} dayLabel={weekDayLabels[day.dayOfWeek]} idPrefix={`${id}-${day.dayOfWeek.toLowerCase()}`}
        active={day.isAvailable} start={day.startsAt} end={day.endsAt} errors={errors[day.dayOfWeek]}
        hints={staffHoursHints(day, businessDays?.find(business => business.dayOfWeek === day.dayOfWeek))}
        onActiveChange={isAvailable => change({ ...day, isAvailable })} onStartChange={startsAt => change({ ...day, startsAt })} onEndChange={endsAt => change({ ...day, endsAt })}
        labels={{ active: "Disponible", inactive: "No disponible", start: "Inicio", end: "Fin", switch: "disponible", startAccessible: "inicio", endAccessible: "fin" }} />)}
    </fieldset>
  </form>{footer ? createPortal(actions, footer) : null}</>;
}
