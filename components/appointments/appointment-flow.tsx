"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  Search,
  UserPlus,
  X,
} from "lucide-react";

import { TaskMobileHeader } from "@/components/layouts";
import { Avatar, Badge, Button, IconButton, InlineAlert, Input, Textarea } from "@/components/ui";
import {
  demoCustomers,
  demoServiceOfferings,
  demoStaffMembers,
  formatDuration,
  formatPrice,
} from "@/lib/demo";
import type { AvailabilitySlot } from "@/lib/demo";
import { cn } from "@/lib/utils";

type CustomerMode = "existing" | "quick";

export type AppointmentFlowProps = {
  initialSlot?: AvailabilitySlot | null;
  onClose: () => void;
};

const activeServices = demoServiceOfferings.filter((service) => service.status === "ACTIVE");
const activeStaffMembers = demoStaffMembers.filter((staffMember) => staffMember.status === "ACTIVE");
const defaultCustomer = demoCustomers[0];
const visibleServiceIds = [23, 20, 22];
const appointmentTimes = ["10:15", "10:30", "10:45", "11:15", "15:30", "16:30", "17:00"];

function getDefaultServiceId(slot?: AvailabilitySlot | null) {
  return String(slot?.serviceOfferingId ?? 23);
}

function getDefaultStaffId(slot?: AvailabilitySlot | null) {
  return String(slot?.staffMemberIds[0] ?? 1);
}

function getDefaultTime(slot?: AvailabilitySlot | null) {
  return slot?.startsAt.slice(11, 16) ?? "15:30";
}

export function AppointmentDrawer({ initialSlot, onClose }: AppointmentFlowProps) {
  return (
    <div className="fixed inset-0 z-50 hidden md:block" role="presentation">
      <button
        aria-label="Cerrar crear turno"
        className="absolute inset-0 bg-scrim backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Crear turno"
        className="absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col bg-surface-container-lowest shadow-floating"
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-8 py-7">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Nuevo turno</h2>
              <Badge tone="positive">Horario disponible</Badge>
            </div>
            <p className="mt-2 text-lg text-on-surface-variant">Mar 28 abr · 15:30 · Mateo Ruiz</p>
          </div>
          <IconButton label="Cerrar" onClick={onClose} variant="ghost">
            <X />
          </IconButton>
        </div>
        <AppointmentTabs />
        <AppointmentForm
          className="flex-1 overflow-y-auto px-8 py-7"
          initialSlot={initialSlot}
          onClose={onClose}
        />
      </aside>
    </div>
  );
}

export function AppointmentMobileScreen({ initialSlot, onClose }: AppointmentFlowProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface text-on-surface md:hidden">
      <TaskMobileHeader
        action="back"
        className="justify-start"
        context="Martes 28 de abril · 10:15 · Mateo Ruiz"
        onAction={onClose}
        title="Crear turno"
      />
      <AppointmentForm
        className="flex-1 overflow-y-auto px-5 py-6"
        initialSlot={initialSlot}
        mobile
        onClose={onClose}
      />
    </div>
  );
}

function AppointmentTabs() {
  return (
    <div className="flex gap-6 border-b border-outline-variant px-8">
      {["Crear", "Editar", "Reprogramar"].map((tab, index) => (
        <button
          className={cn(
            "h-14 border-b-2 text-base font-medium",
            index === 0 ? "border-primary text-primary" : "border-transparent text-on-surface",
          )}
          key={tab}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function AppointmentForm({
  className,
  initialSlot,
  mobile = false,
  onClose,
}: AppointmentFlowProps & {
  className?: string;
  mobile?: boolean;
}) {
  const [customerMode, setCustomerMode] = useState<CustomerMode>("existing");
  const [quickCustomerName, setQuickCustomerName] = useState("");
  const [quickCustomerPhone, setQuickCustomerPhone] = useState("");
  const [serviceId, setServiceId] = useState(getDefaultServiceId(initialSlot));
  const [staffMemberId, setStaffMemberId] = useState(getDefaultStaffId(initialSlot));
  const [time, setTime] = useState(getDefaultTime(initialSlot));
  const [internalNotes, setInternalNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedService = useMemo(
    () => activeServices.find((service) => String(service.id) === serviceId) ?? activeServices[0],
    [serviceId],
  );
  const selectedStaffMember = useMemo(
    () =>
      activeStaffMembers.find((staffMember) => String(staffMember.id) === staffMemberId) ??
      activeStaffMembers[0],
    [staffMemberId],
  );

  const customerName =
    customerMode === "existing" ? defaultCustomer.name : quickCustomerName || "Cliente rapido";
  const canSubmit =
    selectedService &&
    selectedStaffMember &&
    time &&
    (customerMode === "existing" || (quickCustomerName.trim().length > 2 && quickCustomerPhone.trim().length > 5));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form
      className={cn("flex flex-col gap-7", className)}
      data-testid="appointment-flow"
      onSubmit={handleSubmit}
    >
      {submitted ? (
        <InlineAlert tone="positive" title="Turno preparado">
          El flujo mock validó el formulario. La persistencia real espera el endpoint definitivo.
        </InlineAlert>
      ) : null}

      {mobile ? (
        <section className="rounded-2xl border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest p-6 shadow-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-bold">Martes 28 de abril</p>
              <p className="mt-3 text-2xl text-on-surface-variant">{time} · {selectedStaffMember.name}</p>
            </div>
            <Badge tone="positive">Horario disponible</Badge>
          </div>
        </section>
      ) : null}

      <Section title="Cliente" actionLabel="Crear cliente rápido" onAction={() => setCustomerMode("quick")}>
        {customerMode === "existing" ? (
          <button
            className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-5 py-5 text-left"
            type="button"
          >
            <span className="flex min-w-0 items-center gap-4">
              <Avatar initials="SM" name={defaultCustomer.name} size="lg" />
              <span className="min-w-0">
                <span className="block truncate text-xl font-semibold">{defaultCustomer.name}</span>
                <span className="mt-1 block text-base text-on-surface-variant">{defaultCustomer.phoneNumber}</span>
              </span>
            </span>
            {mobile ? <Search className="size-6 text-primary" /> : <Edit3 className="size-5 text-on-surface-variant" />}
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre del cliente">
              <Input
                aria-label="Nombre del cliente"
                placeholder="Nombre y apellido"
                value={quickCustomerName}
                onChange={(event) => setQuickCustomerName(event.target.value)}
              />
            </Field>
            <Field label="Telefono del cliente">
              <Input
                aria-label="Telefono del cliente"
                placeholder="+54 11 ..."
                value={quickCustomerPhone}
                onChange={(event) => setQuickCustomerPhone(event.target.value)}
              />
            </Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            aria-pressed={customerMode === "existing"}
            onClick={() => setCustomerMode("existing")}
            type="button"
            variant={customerMode === "existing" ? "subtle" : "outline"}
          >
            Existente
          </Button>
          <Button
            aria-pressed={customerMode === "quick"}
            onClick={() => setCustomerMode("quick")}
            type="button"
            variant={customerMode === "quick" ? "subtle" : "outline"}
          >
            <UserPlus />
            Rapido
          </Button>
        </div>
      </Section>

      <Section title="Servicio">
        <div className="grid gap-3 sm:grid-cols-2">
          {activeServices
            .filter((service) => visibleServiceIds.includes(service.id))
            .map((service) => (
            <SelectableCard
              active={serviceId === String(service.id)}
              className={service.id === 23 ? "sm:col-span-2" : undefined}
              key={service.id}
              onClick={() => setServiceId(String(service.id))}
            >
              <span className="min-w-0">
                <span className="block truncate text-lg font-semibold">{service.name}</span>
                <span className="mt-1 block text-sm text-on-surface-variant">
                  {service.category}, {formatDuration(service.durationMinutes)}
                </span>
              </span>
              <span className="text-lg font-bold text-primary">{formatPrice(service.priceCents)}</span>
            </SelectableCard>
            ))}
        </div>
      </Section>

      <Section title="Profesional">
        <div className="grid gap-3 sm:grid-cols-3">
          {activeStaffMembers.map((staffMember) => (
            <SelectableCard
              active={staffMemberId === String(staffMember.id)}
              disabled={staffMember.id === 2}
              key={staffMember.id}
              onClick={() => setStaffMemberId(String(staffMember.id))}
            >
              <span>
                <span className="block text-lg font-semibold">{staffMember.name}</span>
                <span className="mt-1 block text-sm text-on-surface-variant">
                  {staffMember.id === 2 ? "Ocupado" : staffMember.availabilityText.replace("Disponible hoy desde ", "Disponible")}
                </span>
              </span>
              {staffMemberId === String(staffMember.id) ? <CheckCircle2 className="size-5 text-primary" /> : null}
            </SelectableCard>
          ))}
        </div>
      </Section>

      <Section title="Horario" actionLabel="Otras opciones">
        <div className="flex flex-wrap gap-3">
          {appointmentTimes.slice(0, mobile ? 4 : 7).map((option) => (
            <button
              aria-pressed={time === option}
              className={cn(
                "h-11 rounded-lg border px-5 text-lg font-medium transition-colors",
                time === option
                  ? "border-primary bg-primary text-on-primary shadow-soft"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
              )}
              key={option}
              onClick={() => setTime(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Notas internas">
        <Textarea
          aria-label="Notas internas"
          className="min-h-32 text-base"
          placeholder="Agregar nota para el equipo"
          value={internalNotes}
          onChange={(event) => setInternalNotes(event.target.value)}
        />
      </Section>

      <div
        className={cn(
          "mt-auto bg-surface-container-lowest",
          mobile ? "space-y-5 pb-2" : "sticky bottom-0 border-t border-outline-variant py-5",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg text-on-surface-variant">Total</p>
          <p className="text-3xl font-bold">{selectedService ? formatPrice(selectedService.priceCents) : "-"}</p>
        </div>
        <div className={cn("grid gap-3", mobile ? "grid-cols-1" : "grid-cols-[1fr_1.35fr]")}>
          {!mobile ? (
            <Button onClick={onClose} type="button" variant="outline">
              Cerrar
            </Button>
          ) : null}
          <Button className="h-14 text-lg" disabled={!canSubmit} type="submit">
            <CalendarDays />
            Crear turno
          </Button>
          {mobile ? (
            <Button onClick={onClose} type="button" variant="ghost">
              Cancelar
            </Button>
          ) : null}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {customerName}, {selectedService?.name}, {selectedStaffMember?.name}, {time}
      </p>
    </form>
  );
}

function Section({
  actionLabel,
  children,
  onAction,
  title,
}: {
  actionLabel?: string;
  children: ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        {actionLabel ? (
          <button className="text-sm font-semibold text-primary" onClick={onAction} type="button">
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SelectableCard({
  active,
  children,
  className,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex min-h-20 items-center justify-between gap-3 rounded-lg border bg-surface-container-lowest p-4 text-left transition-colors",
        active ? "border-primary shadow-soft" : "border-outline-variant hover:border-primary",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
