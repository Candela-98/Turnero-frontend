"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  MessageCircle,
  Plus,
  PlusCircle,
} from "lucide-react";

import { AppointmentDrawer, AppointmentMobileScreen } from "@/components/appointments";
import {
  AdminMobileBottomNav,
  AdminMobileHeader,
  AdminShellDesktop,
} from "@/components/layouts";
import { Avatar, Badge, Button, FilterPill, IconButton } from "@/components/ui";
import { useAuth } from "@/components/auth";
import {
  demoStaffMembers,
  formatDuration,
  formatPrice,
  getAppointmentsByDate,
  getAvailabilitySlotsByDate,
  getStatusLabel,
} from "@/lib/demo";
import type { AppointmentStatus, AvailabilitySlot, HydratedAppointment } from "@/lib/demo";
import { cn } from "@/lib/utils";

const agendaDate = "2026-04-28";
const visibleHours = Array.from({ length: 12 }, (_, index) => index + 9);

type StaffFilter = "all" | number;
type StatusFilter = "ALL" | "PENDING" | "CONFIRMED";

type TimelineItem =
  | {
      appointment: HydratedAppointment;
      startsAt: string;
      type: "appointment";
    }
  | {
      slot: AvailabilitySlot;
      startsAt: string;
      type: "slot";
    };

const activeStaffMembers = demoStaffMembers.filter((staffMember) => staffMember.status === "ACTIVE");

function getBadgeTone(status: AppointmentStatus) {
  if (status === "CONFIRMED" || status === "COMPLETED") {
    return "positive";
  }

  if (status === "PENDING") {
    return "pending";
  }

  return "neutral";
}

function formatClock(value: string) {
  return value.slice(11, 16);
}

function getHour(value: string) {
  return Number(value.slice(11, 13));
}

function getSlotDuration(slot: AvailabilitySlot) {
  return formatDuration((new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60000);
}

function filterAppointments(
  appointments: HydratedAppointment[],
  staffFilter: StaffFilter,
  statusFilter: StatusFilter,
) {
  return appointments.filter((appointment) => {
    const matchesStaff = staffFilter === "all" || appointment.staffMemberId === staffFilter;
    const matchesStatus = statusFilter === "ALL" || appointment.status === statusFilter;

    return matchesStaff && matchesStatus;
  });
}

function filterSlots(slots: AvailabilitySlot[], staffFilter: StaffFilter, statusFilter: StatusFilter) {
  if (statusFilter !== "ALL") {
    return [];
  }

  return slots.filter((slot) => staffFilter === "all" || slot.staffMemberIds.includes(staffFilter));
}

function buildTimeline(
  appointments: HydratedAppointment[],
  slots: AvailabilitySlot[],
): TimelineItem[] {
  return [
    ...appointments.map((appointment) => ({
      appointment,
      startsAt: appointment.startsAt,
      type: "appointment" as const,
    })),
    ...slots.map((slot) => ({
      slot,
      startsAt: slot.startsAt,
      type: "slot" as const,
    })),
  ].sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

export function AgendaPage() {
  const { user } = useAuth();
  const [staffFilter, setStaffFilter] = useState<StaffFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isAppointmentFlowOpen, setIsAppointmentFlowOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const appointments = useMemo(() => getAppointmentsByDate(agendaDate), []);
  const slots = useMemo(() => getAvailabilitySlotsByDate(agendaDate), []);

  const filteredAppointments = useMemo(
    () => filterAppointments(appointments, staffFilter, statusFilter),
    [appointments, staffFilter, statusFilter],
  );
  const filteredSlots = useMemo(
    () => filterSlots(slots, staffFilter, statusFilter),
    [slots, staffFilter, statusFilter],
  );
  const mobileTimeline = useMemo(
    () => buildTimeline(filteredAppointments, filteredSlots),
    [filteredAppointments, filteredSlots],
  );

  const pendingAppointments = appointments.filter((appointment) => appointment.status === "PENDING");
  const selectedStaffMember =
    staffFilter === "all"
      ? null
      : activeStaffMembers.find((staffMember) => staffMember.id === staffFilter) ?? null;

  function openAppointmentFlow(slot?: AvailabilitySlot) {
    setSelectedSlot(slot ?? null);
    setIsAppointmentFlowOpen(true);
  }

  function closeAppointmentFlow() {
    setIsAppointmentFlowOpen(false);
    setSelectedSlot(null);
  }

  const userInitials = user?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="hidden md:block">
        <AdminShellDesktop
          onNewAppointment={() => openAppointmentFlow()}
          userInitials={userInitials}
          userName={user?.name}
        >
          <AgendaDesktop
            appointments={appointments}
            onCreateAppointment={openAppointmentFlow}
            pendingAppointments={pendingAppointments}
            slots={slots}
          />
        </AdminShellDesktop>
        {isAppointmentFlowOpen ? (
          <AppointmentDrawer initialSlot={selectedSlot} onClose={closeAppointmentFlow} />
        ) : null}
      </div>

      <div className="min-h-screen bg-surface pb-36 text-on-surface md:hidden">
        <AdminMobileHeader subtitle="Agenda de hoy" userInitials={userInitials} userName={user?.name} />
        <main className="px-5 py-5">
          <MobileDateNav />
          <AgendaMobileFilters
            staffFilter={staffFilter}
            statusFilter={statusFilter}
            onStaffFilterChange={setStaffFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {selectedStaffMember ? (
            <SelectedStaffSummary
              appointments={filteredAppointments.length}
              pending={filteredAppointments.filter((appointment) => appointment.status === "PENDING").length}
              slots={filteredSlots.length}
              staffName={selectedStaffMember.name}
              initials={selectedStaffMember.avatarInitials}
            />
          ) : (
            <p className="mt-4 text-sm text-on-surface">
              {filteredAppointments.length} turnos <span className="px-2">·</span>
              {pendingAppointments.length} pendientes <span className="px-2">·</span>
              {filteredSlots.length} disponibles
            </p>
          )}

          <div className="mt-6 space-y-4" data-testid="mobile-agenda-list">
            {mobileTimeline.map((item) =>
              item.type === "appointment" ? (
                <MobileTimelineAppointment
                  appointment={item.appointment}
                  key={`appointment-${item.appointment.id}`}
                  onEditAppointment={() => openAppointmentFlow()}
                />
              ) : (
                <MobileTimelineSlot
                  key={item.slot.id}
                  onCreateAppointment={openAppointmentFlow}
                  slot={item.slot}
                />
              ),
            )}
          </div>
        </main>

        <Button
          className="fixed inset-x-5 bottom-[5.75rem] z-40 h-14 text-base shadow-floating"
          onClick={() => openAppointmentFlow()}
        >
          <Plus />
          Nuevo turno
        </Button>
        <AdminMobileBottomNav />
        {isAppointmentFlowOpen ? (
          <AppointmentMobileScreen initialSlot={selectedSlot} onClose={closeAppointmentFlow} />
        ) : null}
      </div>
    </>
  );
}

function AgendaDesktop({
  appointments,
  onCreateAppointment,
  pendingAppointments,
  slots,
}: {
  appointments: HydratedAppointment[];
  onCreateAppointment: (slot?: AvailabilitySlot) => void;
  pendingAppointments: HydratedAppointment[];
  slots: AvailabilitySlot[];
}) {
  const nextAppointment = appointments.find((appointment) => appointment.status === "CONFIRMED") ?? appointments[0];
  const dailyRevenue = appointments.reduce((total, appointment) => total + appointment.priceCents, 0);

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_270px]">
      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold leading-tight">Agenda</h1>
            <p className="mt-1 text-lg text-on-surface">Martes 28 de abril · Operación diaria</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="inline-grid grid-cols-2 rounded-lg bg-surface-container p-1">
              <Button className="h-10 shadow-soft" size="sm" variant="neutral">
                Día
              </Button>
              <Button className="h-10 shadow-none" size="sm" variant="ghost">
                Semana
              </Button>
            </div>
            <div className="flex items-center rounded-lg bg-surface-container-lowest shadow-soft">
              <IconButton label="Día anterior" variant="ghost">
                <ChevronLeft />
              </IconButton>
              <Button className="px-6 shadow-none" variant="ghost">
                Hoy
              </Button>
              <IconButton label="Día siguiente" variant="ghost">
                <ChevronRight />
              </IconButton>
            </div>
          </div>
        </div>

        <DesktopFilters />

        <div
          className="mt-8 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-panel"
          data-testid="desktop-agenda-board"
        >
          <div className="grid grid-cols-[82px_repeat(3,minmax(180px,1fr))] border-b border-outline-variant bg-surface">
            <div className="px-5 py-4 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
              Hora
            </div>
            {activeStaffMembers.map((staffMember) => (
              <div
                className="border-l border-outline-variant px-5 py-4 text-center text-lg font-semibold"
                key={staffMember.id}
              >
                {staffMember.name}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[82px_repeat(3,minmax(180px,1fr))]">
            {visibleHours.map((hour) => (
              <DesktopHourRow
                appointments={appointments}
                hour={hour}
                key={hour}
                onCreateAppointment={onCreateAppointment}
                slots={slots}
              />
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-8">
        {nextAppointment ? <NextAppointmentPanel appointment={nextAppointment} /> : null}
        <DayLoadPanel
          appointmentCount={appointments.length}
          dailyRevenue={dailyRevenue}
          staffCount={activeStaffMembers.length}
        />
        <PendingPanel pendingAppointments={pendingAppointments} />
      </aside>
    </div>
  );
}

function DesktopFilters() {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      {["Todos los Profesionales", "Todos los Servicios", "Todos los Estados"].map((label) => (
        <button
          className="inline-flex h-13 min-w-[200px] items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest px-5 text-base shadow-soft"
          key={label}
          type="button"
        >
          {label}
          <ChevronRight className="size-4 rotate-90 text-on-surface-variant" />
        </button>
      ))}
      <button className="h-13 px-4 text-base text-on-surface-variant" type="button">
        Limpiar
      </button>
    </div>
  );
}

function DesktopHourRow({
  appointments,
  hour,
  onCreateAppointment,
  slots,
}: {
  appointments: HydratedAppointment[];
  hour: number;
  onCreateAppointment: (slot?: AvailabilitySlot) => void;
  slots: AvailabilitySlot[];
}) {
  return (
    <>
      <div className="min-h-20 border-b border-outline-variant px-5 py-4 text-right text-sm text-on-surface-variant">
        {String(hour).padStart(2, "0")}:00
      </div>
      {activeStaffMembers.map((staffMember) => {
        const appointment = appointments.find(
          (item) => item.staffMemberId === staffMember.id && getHour(item.startsAt) === hour,
        );
        const slot = slots.find(
          (item) => item.staffMemberIds.includes(staffMember.id) && getHour(item.startsAt) === hour,
        );

        return (
          <div
            className="min-h-20 border-b border-l border-outline-variant bg-surface-container-lowest px-3 py-3"
            key={`${hour}-${staffMember.id}`}
          >
            {appointment ? (
              <DesktopGridAppointment appointment={appointment} />
            ) : slot ? (
              <DesktopGridSlot onCreateAppointment={onCreateAppointment} slot={slot} />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function DesktopGridAppointment({ appointment }: { appointment: HydratedAppointment }) {
  return (
    <article
      className={cn(
        "rounded-lg border-l-4 bg-surface-container-lowest px-4 py-3 shadow-soft",
        appointment.status === "PENDING" ? "border-l-primary" : "border-l-tertiary-fixed-dim",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{appointment.customer.name}</p>
          <p className="mt-1 truncate text-xs text-on-surface-variant">
            {appointment.serviceOffering.name}
          </p>
        </div>
        <p className="text-xs font-semibold text-primary">{formatClock(appointment.startsAt)}</p>
      </div>
    </article>
  );
}

function DesktopGridSlot({
  onCreateAppointment,
  slot,
}: {
  onCreateAppointment: (slot: AvailabilitySlot) => void;
  slot: AvailabilitySlot;
}) {
  return (
    <button
      className="flex min-h-14 w-full items-center justify-between rounded-lg border border-dashed border-outline bg-surface-container-low px-4 py-3 text-left text-sm text-on-surface-variant hover:border-primary hover:text-primary"
      onClick={() => onCreateAppointment(slot)}
      type="button"
    >
      <span>
        <span className="font-semibold text-on-surface">Disponible</span>
        <span className="block text-xs">{getSlotDuration(slot)}</span>
      </span>
      <PlusCircle className="size-4" />
    </button>
  );
}

function NextAppointmentPanel({ appointment }: { appointment: HydratedAppointment }) {
  return (
    <section className="rounded-xl border-l-4 border-l-tertiary-fixed-dim bg-surface-container-lowest p-7 shadow-panel">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide">Próximo turno</p>
        <Badge tone="positive">Confirmado</Badge>
      </div>
      <p className="mt-8 text-4xl font-bold">{formatClock(appointment.startsAt)}</p>
      <p className="mt-2 text-sm text-on-surface-variant">En 45 min</p>
      <p className="mt-5 text-lg font-semibold">{appointment.customer.name}</p>
      <p className="mt-1 text-base text-on-surface-variant">
        {appointment.serviceOffering.name} · {appointment.staffMember.name}
      </p>
      <Button className="mt-6 w-full" variant="subtle">
        Ver detalle
      </Button>
    </section>
  );
}

function DayLoadPanel({
  appointmentCount,
  dailyRevenue,
  staffCount,
}: {
  appointmentCount: number;
  dailyRevenue: number;
  staffCount: number;
}) {
  return (
    <section className="rounded-xl bg-surface-container-low p-7 shadow-soft">
      <h2 className="text-2xl font-semibold">Carga del día</h2>
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <p className="text-sm text-on-surface-variant">Turnos</p>
          <p className="mt-1 text-3xl font-bold">{appointmentCount}</p>
        </div>
        <div>
          <p className="text-sm text-on-surface-variant">Profesionales</p>
          <p className="mt-1 text-3xl font-bold">{staffCount}</p>
        </div>
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between text-sm">
          <span>Ocupación estimada</span>
          <span className="font-semibold text-primary">78%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-surface-container-high">
          <div className="h-full w-[78%] rounded-full bg-primary" />
        </div>
      </div>
      <p className="mt-6 text-sm text-on-surface-variant">Ingresos est. {formatPrice(dailyRevenue)}</p>
    </section>
  );
}

function PendingPanel({ pendingAppointments }: { pendingAppointments: HydratedAppointment[] }) {
  return (
    <section className="rounded-xl bg-surface-container-lowest p-7 shadow-panel">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Pendientes</h2>
        <Badge>{pendingAppointments.length}</Badge>
      </div>
      <div className="mt-5 space-y-4">
        {pendingAppointments.map((appointment) => (
          <article className="rounded-lg border border-outline-variant p-4" key={appointment.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{appointment.customer.name}</p>
                <p className="mt-1 text-sm font-medium text-primary">{formatClock(appointment.startsAt)}</p>
              </div>
              <Badge tone="pending">Pendiente</Badge>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              {appointment.serviceOffering.name} · {appointment.staffMember.name}
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm">Confirmar</Button>
              <Button size="sm" variant="subtle">
                Ver detalle
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MobileDateNav() {
  return (
    <section className="flex items-center justify-between gap-3">
      <IconButton label="Día anterior" variant="subtle">
        <ChevronLeft />
      </IconButton>
      <div className="text-center">
        <p className="text-lg font-semibold">Hoy, Martes</p>
        <p className="text-lg font-semibold">28 de abril</p>
      </div>
      <div className="flex gap-2">
        <IconButton label="Día siguiente" variant="subtle">
          <ChevronRight />
        </IconButton>
        <IconButton label="Abrir calendario" variant="subtle">
          <CalendarDays />
        </IconButton>
      </div>
    </section>
  );
}

type AgendaMobileFiltersProps = {
  onStaffFilterChange: (value: StaffFilter) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  staffFilter: StaffFilter;
  statusFilter: StatusFilter;
};

function AgendaMobileFilters({
  onStaffFilterChange,
  onStatusFilterChange,
  staffFilter,
  statusFilter,
}: AgendaMobileFiltersProps) {
  return (
    <section className="mt-5 space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-on-surface-variant">Profesionales</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill active={staffFilter === "all"} onClick={() => onStaffFilterChange("all")}>
            Todos
          </FilterPill>
          {activeStaffMembers.map((staffMember) => (
            <FilterPill
              active={staffFilter === staffMember.id}
              key={staffMember.id}
              onClick={() => onStaffFilterChange(staffMember.id)}
            >
              {staffMember.name.split(" ")[0]}
            </FilterPill>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-on-surface-variant">Estados</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill active={statusFilter === "ALL"} onClick={() => onStatusFilterChange("ALL")}>
            Todos
          </FilterPill>
          <FilterPill
            active={statusFilter === "PENDING"}
            onClick={() => onStatusFilterChange("PENDING")}
          >
            Pendientes
          </FilterPill>
          <FilterPill
            active={statusFilter === "CONFIRMED"}
            onClick={() => onStatusFilterChange("CONFIRMED")}
          >
            Confirmados
          </FilterPill>
        </div>
      </div>
    </section>
  );
}

function SelectedStaffSummary({
  appointments,
  initials,
  pending,
  slots,
  staffName,
}: {
  appointments: number;
  initials: string;
  pending: number;
  slots: number;
  staffName: string;
}) {
  return (
    <section className="mt-5 flex items-center gap-4 rounded-xl bg-surface-container-low p-5">
      <Avatar initials={initials} name={staffName} size="lg" />
      <div>
        <p className="text-xl font-semibold">{staffName}</p>
        <p className="text-base text-on-surface-variant">
          {appointments} turnos · {pending} pendiente · {slots} disponibles
        </p>
      </div>
    </section>
  );
}

function MobileTimelineAppointment({
  appointment,
  onEditAppointment,
}: {
  appointment: HydratedAppointment;
  onEditAppointment: () => void;
}) {
  return (
    <article className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4">
      <time className="pt-3 text-lg font-semibold">{formatClock(appointment.startsAt)}</time>
      <div
        className={cn(
          "rounded-lg border-l-4 bg-surface-container-lowest p-4 shadow-soft",
          appointment.status === "PENDING" ? "border-l-primary-fixed-dim" : "border-l-tertiary-fixed-dim",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold">{appointment.customer.name}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {appointment.serviceOffering.name}
              <span className="px-2 text-outline">|</span>
              {appointment.staffMember.name}
            </p>
          </div>
          <Badge tone={getBadgeTone(appointment.status)}>{getStatusLabel(appointment.status)}</Badge>
        </div>

        {appointment.status === "PENDING" ? (
          <p className="mt-3 inline-flex rounded-md bg-primary-fixed px-3 py-2 text-xs text-primary">
            Confirmar por WhatsApp
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <IconButton label="Enviar mensaje" size="sm" variant="subtle">
            <MessageCircle />
          </IconButton>
          {appointment.status === "PENDING" ? (
            <Button size="sm">
              <CheckCircle2 />
              Confirmar
            </Button>
          ) : null}
          <IconButton label="Editar turno" onClick={onEditAppointment} size="sm" variant="subtle">
            <Edit3 />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

function MobileTimelineSlot({
  onCreateAppointment,
  slot,
}: {
  onCreateAppointment: (slot: AvailabilitySlot) => void;
  slot: AvailabilitySlot;
}) {
  return (
    <article className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4">
      <time className="pt-3 text-lg font-semibold text-on-surface-variant">{formatClock(slot.startsAt)}</time>
      <button
        className="flex items-center justify-between rounded-lg border border-dashed border-outline bg-surface-container-low px-4 py-4 text-left"
        onClick={() => onCreateAppointment(slot)}
        type="button"
      >
        <span>
          <span className="block font-semibold">Disponible</span>
          <span className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
            <Clock3 className="size-4" />
            {getSlotDuration(slot)}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <PlusCircle className="size-4" />
          Crear turno
        </span>
      </button>
    </article>
  );
}
