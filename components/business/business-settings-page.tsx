"use client";

import { Building2, CheckCircle2, Clock3, Save, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AdminMobileStickyAction } from "@/components/layouts";
import { Button, InlineAlert, Input, Select, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import {
  getBusiness,
  toBusinessFormValues,
  toBusinessUpdateRequest,
  updateBusiness,
  type BusinessApiResponse,
  type BusinessFormValues,
} from "@/lib/business";

const timezoneOptions = [
  { label: "Argentina — Buenos Aires", value: "America/Argentina/Buenos_Aires" },
  { label: "Argentina — Catamarca", value: "America/Argentina/Catamarca" },
  { label: "Argentina — Córdoba", value: "America/Argentina/Cordoba" },
  { label: "Argentina — Jujuy", value: "America/Argentina/Jujuy" },
  { label: "Argentina — Mendoza", value: "America/Argentina/Mendoza" },
  { label: "Argentina — Salta", value: "America/Argentina/Salta" },
  { label: "Argentina — Tucumán", value: "America/Argentina/Tucuman" },
  { label: "Bolivia", value: "America/La_Paz" },
  { label: "Brasil — São Paulo", value: "America/Sao_Paulo" },
  { label: "Chile — Santiago", value: "America/Santiago" },
  { label: "Colombia", value: "America/Bogota" },
  { label: "Ecuador", value: "America/Guayaquil" },
  { label: "España", value: "Europe/Madrid" },
  { label: "México — Ciudad de México", value: "America/Mexico_City" },
  { label: "Paraguay", value: "America/Asuncion" },
  { label: "Perú", value: "America/Lima" },
  { label: "Uruguay", value: "America/Montevideo" },
  { label: "Venezuela", value: "America/Caracas" },
] as const;

type FieldName = keyof BusinessFormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const editableFields: readonly FieldName[] = ["name", "industry", "email", "phone", "address", "timezone"];

function validate(values: BusinessFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) errors.name = "Ingresá el nombre del negocio.";
  else if (values.name.trim().length > 120) errors.name = "El nombre no puede superar los 120 caracteres.";

  if (values.industry.trim().length > 120) errors.industry = "El rubro no puede superar los 120 caracteres.";
  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Ingresá un correo válido.";
  else if (values.email.trim().length > 150) errors.email = "El correo no puede superar los 150 caracteres.";
  if (values.phone.trim().length > 50) errors.phone = "El teléfono no puede superar los 50 caracteres.";
  if (values.address.trim().length > 255) errors.address = "La dirección no puede superar los 255 caracteres.";
  if (!timezoneOptions.some((option) => option.value === values.timezone)) {
    errors.timezone = "Elegí una zona horaria válida.";
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

function formatBusinessTime(timezone: string, format: "compact" | "full") {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: format === "compact" ? "medium" : "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date());
}

function formatTimezoneLabel(timezone: string) {
  return timezoneOptions.find((option) => option.value === timezone)?.label ?? timezone;
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

export function BusinessSettingsPage() {
  const { updateBusiness: updateSessionBusiness } = useAuth();
  const [business, setBusiness] = useState<BusinessApiResponse | null>(null);
  const [values, setValues] = useState<BusinessFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const formId = useId();

  const loadBusiness = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await getBusiness();
      setBusiness(response);
      setValues(toBusinessFormValues(response));
      setFieldErrors({});
    } catch {
      setLoadError("No pudimos cargar los datos del negocio. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBusiness();
  }, [loadBusiness]);

  const businessTime = useMemo(
    () => (business ? formatBusinessTime(business.timezone, "full") : null),
    [business],
  );
  const compactBusinessTime = useMemo(
    () => (business ? formatBusinessTime(business.timezone, "compact") : null),
    [business],
  );
  const businessTimezoneLabel = useMemo(
    () => (business ? formatTimezoneLabel(business.timezone) : null),
    [business],
  );

  function updateValue(field: FieldName, value: string) {
    setValues((current) => current ? { ...current, [field]: value } : current);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setHasSaved(false);
    setSaveError(null);
  }

  async function save(valuesToSave: BusinessFormValues) {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await updateBusiness(toBusinessUpdateRequest(valuesToSave));
      setBusiness(response);
      setValues(toBusinessFormValues(response));
      setFieldErrors({});
      setHasSaved(true);
      updateSessionBusiness({
        id: response.id,
        name: response.name,
        onboarding_status: response.onboarding_status,
        slug: response.slug,
      });
    } catch (error) {
      const errors = apiFieldErrors(error);
      setFieldErrors(errors);
      if (Object.keys(errors).length === 0) {
        setSaveError("No pudimos guardar los cambios. Intentá nuevamente.");
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
      <section aria-label="Cargando configuración" className="mx-auto max-w-4xl">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-3 h-6 w-full max-w-xl" />
        <Skeleton className="mt-8 h-[34rem] w-full rounded-xl" />
      </section>
    );
  }

  if (loadError || !business || !values) {
    return (
      <section className="mx-auto max-w-2xl py-10">
        <InlineAlert title="No pudimos cargar la configuración" tone="error">
          {loadError ?? "Intentá nuevamente."}
        </InlineAlert>
        <Button className="mt-4" onClick={() => void loadBusiness()}>
          Reintentar
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl pb-[calc(10.5rem+env(safe-area-inset-bottom))] md:pb-8">
      <header className="mb-5 px-5 pt-5 md:mb-8 md:px-0 md:pt-0">
        <p className="text-sm font-semibold text-primary">Administración</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:mt-2 sm:text-4xl">Configuración</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant sm:mt-3 sm:text-base sm:leading-7">
          Actualizá la información que se mostrará a tus clientes y la referencia horaria del negocio.
        </p>
        <Link
          className="mt-4 inline-flex min-h-touch items-center gap-2 rounded-lg border border-outline bg-surface-container-lowest px-3 text-sm font-semibold text-primary shadow-soft transition-colors hover:bg-surface-container-low"
          href="/configuracion/reservas"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Configurar reglas de reserva
        </Link>
      </header>

      <form className="rounded-xl bg-surface-container-lowest p-5 shadow-panel sm:p-8" id={formId} noValidate onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-outline-variant pb-5 sm:flex-row sm:items-center sm:gap-4 sm:pb-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary-fixed text-primary sm:size-12">
            <Building2 aria-hidden="true" className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Información del negocio</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Datos públicos visibles para tus clientes.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:mt-7 sm:gap-5 sm:grid-cols-2">
          <Field error={fieldErrors.name} htmlFor={`${formId}-name`} label="Nombre del negocio">
            <Input
              aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
              aria-invalid={Boolean(fieldErrors.name)}
              id={`${formId}-name`}
              maxLength={120}
              onChange={(event) => updateValue("name", event.target.value)}
              required
              value={values.name}
            />
          </Field>
          <Field error={fieldErrors.industry} htmlFor={`${formId}-industry`} label="Rubro">
            <Input
              aria-describedby={fieldErrors.industry ? `${formId}-industry-error` : undefined}
              aria-invalid={Boolean(fieldErrors.industry)}
              id={`${formId}-industry`}
              maxLength={120}
              onChange={(event) => updateValue("industry", event.target.value)}
              placeholder="Ej. Barbería"
              value={values.industry}
            />
          </Field>
          <Field error={fieldErrors.phone} htmlFor={`${formId}-phone`} label="Teléfono">
            <Input
              aria-describedby={fieldErrors.phone ? `${formId}-phone-error` : undefined}
              aria-invalid={Boolean(fieldErrors.phone)}
              id={`${formId}-phone`}
              maxLength={50}
              onChange={(event) => updateValue("phone", event.target.value)}
              placeholder="Ej. +54 11 5555-5555"
              type="tel"
              value={values.phone}
            />
          </Field>
          <Field error={fieldErrors.email} htmlFor={`${formId}-email`} label="Correo electrónico">
            <Input
              aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
              aria-invalid={Boolean(fieldErrors.email)}
              id={`${formId}-email`}
              maxLength={150}
              onChange={(event) => updateValue("email", event.target.value)}
              placeholder="Ej. hola@negocio.com"
              type="email"
              value={values.email}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field error={fieldErrors.address} htmlFor={`${formId}-address`} label="Dirección">
              <Input
                aria-describedby={fieldErrors.address ? `${formId}-address-error` : undefined}
                aria-invalid={Boolean(fieldErrors.address)}
                id={`${formId}-address`}
                maxLength={255}
                onChange={(event) => updateValue("address", event.target.value)}
                placeholder="Ej. Av. Siempre Viva 123"
                value={values.address}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field error={fieldErrors.timezone} htmlFor={`${formId}-timezone`} label="Zona horaria">
              <Select
                aria-describedby={fieldErrors.timezone ? `${formId}-timezone-error` : undefined}
                aria-invalid={Boolean(fieldErrors.timezone)}
                id={`${formId}-timezone`}
                onChange={(event) => updateValue("timezone", event.target.value)}
                value={values.timezone}
              >
                {timezoneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-surface-container-low p-4">
          <div className="flex gap-3">
            <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Horario del negocio</p>
              <p className="mt-1 text-sm text-on-surface-variant" data-testid="business-time-reference">
                <span className="md:hidden">{compactBusinessTime} · {businessTimezoneLabel}</span>
                <span className="hidden md:inline">Hora actual de referencia en {businessTimezoneLabel}: <span className="font-medium text-on-surface">{businessTime}</span></span>
              </p>
            </div>
          </div>
        </div>

        {saveError ? (
          <InlineAlert className="mt-6" title="No pudimos guardar los cambios" tone="error">
            <p>{saveError}</p>
            <Button className="mt-3" onClick={() => void save(values)} size="sm" variant="outline">
              Reintentar
            </Button>
          </InlineAlert>
        ) : null}
        {hasSaved ? (
          <InlineAlert className="relative mt-6 pr-12" title="Cambios guardados" tone="positive">
            <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="size-4" />La información del negocio está actualizada.</span>
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
        <Button className="w-full" data-testid="business-settings-mobile-save" disabled={isSaving} form={formId} type="submit">
          <Save aria-hidden="true" />
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </AdminMobileStickyAction>
    </section>
  );
}
