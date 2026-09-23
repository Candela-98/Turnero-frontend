"use client";

import { CheckCircle2, ChevronLeft, Save, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useId, useState } from "react";

import { AdminMobileStickyAction } from "@/components/layouts";
import { Button, InlineAlert, Input, Select, Skeleton } from "@/components/ui";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  getBookingSettings,
  toBookingSettingsFormValues,
  toBookingSettingsUpdateRequest,
  updateBookingSettings,
  type BookingSettingsApiResponse,
  type BookingSettingsFormValues,
} from "@/lib/booking-settings";

const slotIntervalOptions = [15, 30, 45, 60] as const;

type FieldName = keyof BookingSettingsFormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const editableFields: readonly FieldName[] = [
  "publicBookingEnabled",
  "bookingWindowDays",
  "minNoticeHours",
  "cancellationNoticeHours",
  "slotIntervalMinutes",
  "manualConfirmationEnabled",
];

function parseWholeNumber(value: string) {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value);
}

function validate(values: BookingSettingsFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const bookingWindowDays = parseWholeNumber(values.bookingWindowDays);
  const minNoticeHours = parseWholeNumber(values.minNoticeHours);
  const cancellationNoticeHours = parseWholeNumber(values.cancellationNoticeHours);

  if (bookingWindowDays === null || bookingWindowDays < 1) {
    errors.bookingWindowDays = "Ingresá una cantidad entera de al menos 1 día.";
  }
  if (minNoticeHours === null || minNoticeHours < 0) {
    errors.minNoticeHours = "Ingresá una cantidad entera de 0 horas o más.";
  }
  if (cancellationNoticeHours === null || cancellationNoticeHours < 0) {
    errors.cancellationNoticeHours = "Ingresá una cantidad entera de 0 horas o más.";
  }
  if (!slotIntervalOptions.some((option) => String(option) === values.slotIntervalMinutes)) {
    errors.slotIntervalMinutes = "Elegí un intervalo de 15, 30, 45 o 60 minutos.";
  }

  return errors;
}

function apiFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {};

  return error.details.reduce<FieldErrors>((errors, detail) => {
    if (
      typeof detail === "object"
      && detail !== null
      && "field" in detail
      && "message" in detail
      && typeof detail.field === "string"
      && typeof detail.message === "string"
      && editableFields.includes(detail.field as FieldName)
    ) {
      errors[detail.field as FieldName] = detail.message;
    }
    return errors;
  }, {});
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  const errorId = `${htmlFor}-error`;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-on-surface-variant" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-2 text-sm text-error" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}

function NumberField({
  error,
  id,
  label,
  min,
  onChange,
  unit,
  value,
}: {
  error?: string;
  id: string;
  label: string;
  min: number;
  onChange: (value: string) => void;
  unit: string;
  value: string;
}) {
  return (
    <Field error={error} htmlFor={id} label={label}>
      <div className="relative">
        <Input
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error)}
          id={id}
          inputMode="numeric"
          min={min}
          onChange={(event) => onChange(event.target.value)}
          step={1}
          type="number"
          value={value}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">{unit}</span>
      </div>
    </Field>
  );
}

function ToggleField({
  checked,
  description,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
      </div>
      <Switch aria-labelledby={id} checked={checked} onCheckedChange={onCheckedChange} />
      <span className="sr-only" id={id}>{label}</span>
    </div>
  );
}

export function BookingSettingsPage() {
  const [settings, setSettings] = useState<BookingSettingsApiResponse | null>(null);
  const [values, setValues] = useState<BookingSettingsFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const formId = useId();

  const loadBookingSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await getBookingSettings();
      setSettings(response);
      setValues(toBookingSettingsFormValues(response));
      setFieldErrors({});
    } catch {
      setLoadError("No pudimos cargar las reglas de reserva. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookingSettings();
  }, [loadBookingSettings]);

  function updateValue<Field extends FieldName>(field: Field, value: BookingSettingsFormValues[Field]) {
    setValues((current) => current ? { ...current, [field]: value } : current);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setHasSaved(false);
    setSaveError(null);
  }

  async function save(valuesToSave: BookingSettingsFormValues) {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await updateBookingSettings(toBookingSettingsUpdateRequest(valuesToSave));
      setSettings(response);
      setValues(toBookingSettingsFormValues(response));
      setFieldErrors({});
      setHasSaved(true);
    } catch (error) {
      const errors = apiFieldErrors(error);
      setFieldErrors(errors);
      if (Object.keys(errors).length === 0) {
        setSaveError("No pudimos guardar las reglas. Intentá nuevamente.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) return;

    const errors = validate(values);
    setFieldErrors(errors);
    setSaveError(null);
    setHasSaved(false);
    if (Object.keys(errors).length > 0) return;

    void save(values);
  }

  if (isLoading) {
    return (
      <section aria-label="Cargando reglas de reserva" className="mx-auto max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-3 h-6 w-full max-w-xl" />
        <Skeleton className="mt-8 h-[32rem] w-full rounded-xl" />
      </section>
    );
  }

  if (loadError || !settings || !values) {
    return (
      <section className="mx-auto max-w-2xl py-10">
        <InlineAlert title="No pudimos cargar las reglas de reserva" tone="error">
          {loadError ?? "Intentá nuevamente."}
        </InlineAlert>
        <Button className="mt-4" onClick={() => void loadBookingSettings()}>
          Reintentar
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl pb-[calc(10.5rem+env(safe-area-inset-bottom))] md:pb-8">
      <header className="mb-5 px-5 pt-5 md:mb-8 md:px-0 md:pt-0">
        <Link className="inline-flex min-h-touch items-center gap-2 text-sm font-semibold text-primary hover:underline" href="/configuracion">
          <ChevronLeft aria-hidden="true" className="size-4" />
          Configuración
        </Link>
        <p className="mt-3 text-sm font-semibold text-primary">Administración</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:mt-2 sm:text-4xl">Reglas de reserva</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant sm:mt-3 sm:text-base sm:leading-7">
          Definí cómo y cuándo tus clientes pueden reservar un turno.
        </p>
      </header>

      <form className="rounded-xl bg-surface-container-lowest p-5 shadow-panel sm:p-8" id={formId} noValidate onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-outline-variant pb-5 sm:flex-row sm:items-center sm:gap-4 sm:pb-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary-fixed text-primary sm:size-12">
            <SlidersHorizontal aria-hidden="true" className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Disponibilidad y confirmación</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Estas reglas se aplican a las próximas reservas.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 sm:mt-7">
          <ToggleField
            checked={values.publicBookingEnabled}
            description="Permití que tus clientes reserven desde el enlace público del negocio."
            label="Aceptar reservas online"
            onCheckedChange={(checked) => updateValue("publicBookingEnabled", checked)}
          />
          <ToggleField
            checked={values.manualConfirmationEnabled}
            description="Las nuevas reservas quedarán pendientes hasta que las confirmes."
            label="Requerir confirmación manual"
            onCheckedChange={(checked) => updateValue("manualConfirmationEnabled", checked)}
          />
        </div>

        <div className="mt-6 grid gap-4 border-t border-outline-variant pt-6 sm:mt-7 sm:grid-cols-2 sm:gap-5 sm:pt-7">
          <NumberField
            error={fieldErrors.bookingWindowDays}
            id={`${formId}-booking-window-days`}
            label="Ventana de reserva"
            min={1}
            onChange={(value) => updateValue("bookingWindowDays", value)}
            unit="días"
            value={values.bookingWindowDays}
          />
          <NumberField
            error={fieldErrors.minNoticeHours}
            id={`${formId}-min-notice-hours`}
            label="Anticipación mínima para reservar"
            min={0}
            onChange={(value) => updateValue("minNoticeHours", value)}
            unit="horas"
            value={values.minNoticeHours}
          />
          <NumberField
            error={fieldErrors.cancellationNoticeHours}
            id={`${formId}-cancellation-notice-hours`}
            label="Anticipación para cancelar"
            min={0}
            onChange={(value) => updateValue("cancellationNoticeHours", value)}
            unit="horas"
            value={values.cancellationNoticeHours}
          />
          <Field error={fieldErrors.slotIntervalMinutes} htmlFor={`${formId}-slot-interval-minutes`} label="Intervalo de agenda">
            <Select
              aria-describedby={fieldErrors.slotIntervalMinutes ? `${formId}-slot-interval-minutes-error` : undefined}
              aria-invalid={Boolean(fieldErrors.slotIntervalMinutes)}
              id={`${formId}-slot-interval-minutes`}
              onChange={(event) => updateValue("slotIntervalMinutes", event.target.value)}
              value={values.slotIntervalMinutes}
            >
              {slotIntervalOptions.map((option) => <option key={option} value={option}>{option} minutos</option>)}
            </Select>
          </Field>
        </div>

        {saveError ? (
          <InlineAlert className="mt-6" title="No pudimos guardar las reglas" tone="error">
            <p>{saveError}</p>
            <Button className="mt-3" onClick={() => void save(values)} size="sm" variant="outline">
              Reintentar
            </Button>
          </InlineAlert>
        ) : null}
        {hasSaved ? (
          <InlineAlert className="relative mt-6 pr-12" title="Cambios guardados" tone="positive">
            <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="size-4" />Las reglas de reserva están actualizadas.</span>
            <button
              aria-label="Cerrar confirmación"
              className="absolute right-4 top-3 rounded-sm p-1 text-on-tertiary-fixed-variant transition-colors hover:bg-tertiary-fixed-dim/40 focus-visible:outline-focus-ring"
              onClick={() => setHasSaved(false)}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </InlineAlert>
        ) : null}

        <div className="mt-7 hidden justify-end border-t border-outline-variant pt-6 md:flex">
          <Button disabled={isSaving} type="submit">
            <Save aria-hidden="true" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
      <AdminMobileStickyAction>
        <Button className="w-full" data-testid="booking-settings-mobile-save" disabled={isSaving} form={formId} type="submit">
          <Save aria-hidden="true" />
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </AdminMobileStickyAction>
    </section>
  );
}
