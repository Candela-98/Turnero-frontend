"use client";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { AppliedFilterChip, Button, EmptyState, InlineAlert, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { agendaDayHours, businessHoursKeys, getAgendaBusinessWeek } from "@/lib/business-hours/queries";
import { bookingSettingsKeys, getAgendaInterval } from "@/lib/booking-settings/queries";
import { getBusiness } from "@/lib/business/api";
import { getDayAppointments, statusLabels, type AgendaFilters } from "@/lib/appointments/api";
import { useAgendaClock } from "@/lib/appointments/use-agenda-clock";
import { businessDate, validDate } from "@/lib/appointments/dates";
import { appointmentKeys, getAgendaStaff } from "@/lib/appointments/queries";
import { AgendaDateNav } from "./agenda-date-nav";
import { AgendaFiltersDialog } from "./agenda-filters";
import { AgendaResults } from "./agenda-results";

export function AgendaPage() {
  const { business, refreshUser } = useAuth();
  const params = useSearchParams(); const router = useRouter();
  const config = useQuery({ queryKey: appointmentKeys.business(business?.id), queryFn: ({ signal }) => getBusiness(signal), enabled: Boolean(business), retry: false, staleTime: 0 });
  const interval = useQuery({ queryKey: bookingSettingsKeys.agendaInterval(business?.id), queryFn: ({ signal }) => getAgendaInterval(signal), enabled: Boolean(business), retry: false, staleTime: 0 });
  const hours = useQuery({ queryKey: businessHoursKeys.agendaWeek(business?.id), queryFn: ({ signal }) => getAgendaBusinessWeek(signal), enabled: Boolean(business), retry: false, staleTime: 0 });
  const timezone = config.data?.timezone;
  const now = useAgendaClock();
  const today = timezone && now !== null ? businessDate(timezone, new Date(now)) : "";
  const dateParam = params.get("date"); const date = validDate(dateParam) ? dateParam : today;
  const selectedHours = hours.data && date ? agendaDayHours(hours.data, date) : undefined;
  const rawStatus = params.get("status"); const rawStaff = params.get("staff");
  const filters: AgendaFilters = { staff: rawStaff && /^[1-9]\d*$/.test(rawStaff) ? rawStaff : "", status: rawStatus && Object.hasOwn(statusLabels, rawStatus) ? rawStatus as AgendaFilters["status"] : "ALL" };
  const day = useQuery({ queryKey: appointmentKeys.day(business?.id, timezone, date, filters), queryFn: ({ signal }) => getDayAppointments(date, filters, signal), enabled: Boolean(timezone && date), retry: false });
  const catalog = useQuery({ queryKey: appointmentKeys.staff(business?.id), queryFn: ({ signal }) => getAgendaStaff(signal), enabled: Boolean(business), retry: false });
  const unauthorized = [config.error, interval.error, hours.error, day.error, catalog.error].some(error => error instanceof ApiError && error.status === 401);
  useEffect(() => { if (unauthorized) void refreshUser(); }, [unauthorized, refreshUser]);
  const staff = useMemo(() => {
    const entries = new Map((catalog.data ?? []).map(member => [member.id, { id: member.id, name: member.name }]));
    for (const appointment of day.data ?? []) entries.set(appointment.staffMemberId, { id: appointment.staffMemberId, name: appointment.staffMemberName });
    return [...entries.values()];
  }, [catalog.data, day.data]);
  function navigate(nextDate: string, nextFilters = filters) {
    const next = new URLSearchParams({ date: nextDate });
    if (nextFilters.staff) next.set("staff", nextFilters.staff);
    if (nextFilters.status !== "ALL") next.set("status", nextFilters.status);
    router.replace(`/agenda?${next}`, { scroll: false });
  }
  const error = config.error ?? interval.error ?? hours.error ?? day.error;
  const forbidden = error instanceof ApiError && error.status === 403;
  const busy = config.isPending || config.isFetching || interval.isPending || interval.isFetching || hours.isPending || hours.isFetching || day.isPending || day.isFetching;
  const hoursFailed = hours.isError && !config.isError && !interval.isError;
  const hasFilters = Boolean(filters.staff) || filters.status !== "ALL";
  return <AdminPageSection className="max-w-none">
    <AdminPageHeader title="Agenda" description="Consultá los turnos del negocio por día, profesional y estado." />
    <div className="min-w-0 space-y-5 px-5 md:px-0">
      {timezone ? <><AgendaDateNav date={date} today={today} onChange={next => navigate(next)} />
        <div className="flex flex-wrap items-center gap-3"><AgendaFiltersDialog filters={filters} staff={staff} loading={catalog.isPending || catalog.isFetching} error={catalog.isError} retry={() => void catalog.refetch()} onApply={next => navigate(date, next)} />
          {filters.staff ? <AppliedFilterChip label={staff.find(member => String(member.id) === filters.staff)?.name ?? `Profesional #${filters.staff}`} removeLabel="Quitar filtro de profesional" onRemove={() => navigate(date, { ...filters, staff: "" })} /> : null}
          {filters.status !== "ALL" ? <AppliedFilterChip label={statusLabels[filters.status]} removeLabel="Quitar filtro de estado" onRemove={() => navigate(date, { ...filters, status: "ALL" })} /> : null}
          {hasFilters ? <Button variant="ghost" onClick={() => navigate(date, { staff: "", status: "ALL" })}>Limpiar filtros</Button> : null}
        </div></> : null}
      {catalog.isError ? <InlineAlert tone="error">No pudimos cargar el selector de profesionales. <Button variant="ghost" onClick={() => void catalog.refetch()}>Reintentar selector</Button></InlineAlert> : null}
      {error ? <InlineAlert tone="error">{forbidden ? "No tenés acceso a la agenda." : interval.isError && !config.isError ? "No pudimos cargar el intervalo de agenda." : hoursFailed ? "No pudimos cargar los horarios del negocio." : "No pudimos cargar la agenda completa."}{!forbidden ? <Button variant="ghost" onClick={() => void (config.isError ? config.refetch() : interval.isError ? interval.refetch() : hours.isError ? hours.refetch() : day.refetch())}>{interval.isError && !config.isError ? "Reintentar intervalo" : hoursFailed ? "Reintentar horarios" : "Reintentar agenda"}</Button> : null}</InlineAlert> : busy ?
        <div role="status" aria-label="Cargando agenda completa" className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div> : day.data?.length ?
        <AgendaResults appointments={day.data} timezone={timezone!} date={date} now={now} slotIntervalMinutes={interval.data!} businessHours={selectedHours!} /> : <EmptyState icon={<CalendarDays />} title={hasFilters ? "No hay coincidencias" : "No hay turnos este día"} description={hasFilters ? "Probá cambiando o limpiando los filtros." : selectedHours?.isClosed ? "El negocio está cerrado en esta fecha." : "Elegí otra fecha para consultar los turnos."} />}
    </div>
  </AdminPageSection>;
}
