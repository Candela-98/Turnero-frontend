"use client";

import { CheckCircle2, ChevronLeft, Clock3 } from "lucide-react";
import Link from "next/link";
import { Fragment, type FormEvent, useCallback, useEffect, useId, useState } from "react";

import { AdminPageSection, AdminFormActions } from "@/components/layouts";
import { Button, FloatingAlert, InlineAlert, Skeleton } from "@/components/ui";
import { WeeklyDayRow } from "@/components/ui/weekly-day-row";
import {
  businessDayLabels,
  getBusinessHours,
  replaceBusinessHours,
  toBusinessHoursFormValues,
  toBusinessHoursReplaceRequest,
  validateBusinessHoursFormValues,
  type BusinessDay,
  type BusinessHoursDayErrors,
  type BusinessHoursFormValues,
  type BusinessHoursListApiResponse,
} from "@/lib/business-hours";
import { useFocusInvalidField } from "@/lib/forms/use-focus-invalid-field";

function BusinessHoursDayRow({ day, errors, formId, onChange }: {
  day: BusinessHoursFormValues["days"][number]; errors?: BusinessHoursDayErrors; formId: string;
  onChange: (day: BusinessHoursFormValues["days"][number]) => void;
}) {
  return <WeeklyDayRow dayLabel={businessDayLabels[day.dayOfWeek]} idPrefix={`${formId}-${day.dayOfWeek.toLowerCase()}`}
    active={!day.isClosed} start={day.opensAt} end={day.closesAt} errors={{ start: errors?.opensAt, end: errors?.closesAt }}
    onActiveChange={active => onChange({ ...day, isClosed: !active })} onStartChange={opensAt => onChange({ ...day, opensAt })} onEndChange={closesAt => onChange({ ...day, closesAt })}
    labels={{ active: "Abierto", inactive: "Cerrado", start: "Apertura", end: "Cierre", switch: "abierto", startAccessible: "apertura", endAccessible: "cierre" }} startSuffix="opens-at" endSuffix="closes-at" />;
}

function hasUnsavedChanges(values: BusinessHoursFormValues, saved: BusinessHoursListApiResponse) {
  const savedDays = new Map(saved.data.map((day) => [day.day_of_week, day]));

  return values.days.some((day) => {
    const original = savedDays.get(day.dayOfWeek);
    if (!original || day.isClosed !== original.is_closed) return true;
    if (day.isClosed) return false;
    return day.opensAt !== original.opens_at || day.closesAt !== original.closes_at;
  });
}

export function BusinessHoursSettingsPage() {
  const [hours, setHours] = useState<BusinessHoursListApiResponse | null>(null);
  const [values, setValues] = useState<BusinessHoursFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<BusinessDay, BusinessHoursDayErrors>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const dismissSaved = useCallback(() => setHasSaved(false), []);
  const formId = useId();
  const focusInvalidField = useFocusInvalidField();
  const hasChanges = Boolean(values && hours && hasUnsavedChanges(values, hours));

  const loadBusinessHours = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await getBusinessHours();
      setHours(response);
      setValues(toBusinessHoursFormValues(response));
      setFieldErrors({});
      setFormError(null);
    } catch {
      setLoadError("No pudimos cargar los horarios del negocio. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBusinessHours();
  }, [loadBusinessHours]);

  function updateDay(updatedDay: BusinessHoursFormValues["days"][number]) {
    setValues((current) => current
      ? { ...current, days: current.days.map((day) => day.dayOfWeek === updatedDay.dayOfWeek ? updatedDay : day) }
      : current);
    setFieldErrors((current) => ({ ...current, [updatedDay.dayOfWeek]: undefined }));
    setFormError(null);
    setSaveError(null);
    setHasSaved(false);
  }

  async function save(valuesToSave: BusinessHoursFormValues) {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await replaceBusinessHours(toBusinessHoursReplaceRequest(valuesToSave));
      setHours(response);
      setValues(toBusinessHoursFormValues(response));
      setFieldErrors({});
      setFormError(null);
      setHasSaved(true);
    } catch {
      setSaveError("No pudimos guardar los horarios. Intentá nuevamente.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) return;

    const validation = validateBusinessHoursFormValues(values);
    setFieldErrors(validation.days);
    const firstInvalidDay = values.days.find((day) => {
      const errors = validation.days[day.dayOfWeek];
      return Boolean(errors?.opensAt || errors?.closesAt);
    });
    const firstInvalidField = firstInvalidDay
      ? validation.days[firstInvalidDay.dayOfWeek]?.opensAt
        ? `${formId}-${firstInvalidDay.dayOfWeek.toLowerCase()}-opens-at`
        : `${formId}-${firstInvalidDay.dayOfWeek.toLowerCase()}-closes-at`
      : null;

    setFormError(validation.form ?? null);
    setSaveError(null);
    setHasSaved(false);
    if (validation.form || firstInvalidField) {
      if (firstInvalidField) focusInvalidField(firstInvalidField);
      return;
    }

    if (!hasChanges) return;
    void save(values);
  }

  if (isLoading) {
    return (
      <section aria-label="Cargando horarios del negocio" className="mx-auto max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-3 h-6 w-full max-w-xl" />
        <Skeleton className="mt-8 h-[42rem] w-full rounded-xl" />
      </section>
    );
  }

  if (loadError || !hours || !values) {
    return (
      <section className="mx-auto max-w-2xl py-10">
        <InlineAlert title="No pudimos cargar los horarios" tone="error">
          {loadError ?? "Intentá nuevamente."}
        </InlineAlert>
        <Button className="mt-4" onClick={() => void loadBusinessHours()}>Reintentar</Button>
      </section>
    );
  }

  const firstDayWithError = values.days.find((day) => {
    const errors = fieldErrors[day.dayOfWeek];
    return Boolean(errors?.opensAt || errors?.closesAt);
  })?.dayOfWeek;
  const formErrorAlert = formError ? (
    <InlineAlert dismissLabel="Cerrar resumen de errores" onDismiss={() => setFormError(null)} title="Revisá los horarios" tone="error">
      <p>{formError}</p>
    </InlineAlert>
  ) : null;

  return (
    <AdminPageSection withSaveAction>
      <header className="mb-5 px-5 pt-5 md:mb-8 md:px-0 md:pt-0">
        <Link className="inline-flex min-h-touch items-center gap-2 text-sm font-semibold text-primary hover:underline" href="/configuracion">
          <ChevronLeft aria-hidden="true" className="size-4" />
          Configuración
        </Link>
        <p className="mt-3 text-sm font-semibold text-primary">Administración</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:mt-2 sm:text-4xl">Horarios de atención</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant sm:mt-3 sm:text-base sm:leading-7">
          Definí la disponibilidad semanal base de tu negocio.
        </p>
      </header>

      <form className="rounded-xl bg-surface-container-lowest p-5 shadow-panel sm:p-8" id={formId} noValidate onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-outline-variant pb-5 sm:flex-row sm:items-center sm:gap-4 sm:pb-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary-fixed text-primary sm:size-12">
            <Clock3 aria-hidden="true" className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Semana laboral</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Indicá los días y horarios en los que el negocio atiende.</p>
          </div>
        </div>

        {!firstDayWithError && formErrorAlert ? <div className="mt-6">{formErrorAlert}</div> : null}

        <div className="mt-6 space-y-3 sm:mt-7">
          {values.days.map((day) => (
            <Fragment key={day.dayOfWeek}>
              {firstDayWithError === day.dayOfWeek ? formErrorAlert : null}
              <BusinessHoursDayRow
                day={day}
                errors={fieldErrors[day.dayOfWeek]}
                formId={formId}
                onChange={updateDay}
              />
            </Fragment>
          ))}
        </div>

        <AdminFormActions formId={formId} hasChanges={hasChanges} isSaving={isSaving} mobileSaveTestId="business-hours-mobile-save">
          {saveError ? (
            <FloatingAlert dismissLabel="Cerrar error" onDismiss={() => setSaveError(null)} title="No pudimos guardar los horarios" tone="error">
              <p>{saveError}</p>
              <Button className="mt-3" disabled={isSaving} onClick={() => void save(values)} size="sm" variant="outline">Reintentar</Button>
            </FloatingAlert>
          ) : null}
          {hasSaved ? (
            <FloatingAlert dismissLabel="Cerrar confirmación" onDismiss={dismissSaved} title="Cambios guardados" tone="positive">
              <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="size-4" />Los horarios del negocio están actualizados.</span>
            </FloatingAlert>
          ) : null}
        </AdminFormActions>
      </form>
    </AdminPageSection>
  );
}
