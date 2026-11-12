"use client";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { AppliedFilterChip, Button, EmptyState, InlineAlert, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { agendaDayHours, businessHoursKeys, getAgendaBusinessWeek } from "@/lib/business-hours/queries";
import { bookingSettingsKeys, getAgendaInterval } from "@/lib/booking-settings/queries";
import { getBusiness } from "@/lib/business/api";
import { getDayAppointments, statusLabels, type AgendaFilters, type Appointment } from "@/lib/appointments/api";
import { useAgendaClock } from "@/lib/appointments/use-agenda-clock";
import { businessDate, validDate } from "@/lib/appointments/dates";
import { appointmentKeys, getAgendaStaff } from "@/lib/appointments/queries";
import { AgendaDesktopFilters } from "./agenda-desktop-filters";
import { AgendaDateNav } from "./agenda-date-nav";
import { AgendaFiltersDialog } from "./agenda-filters";
import { professionalCondition } from "@/lib/appointments/timeline";
import { AgendaProfessionals, type AgendaStaffChoice } from "./agenda-professionals";
import { AgendaResults } from "./agenda-results";

const staffConditionOrder: Record<string,number> = { Inactivo: 1, Eliminado: 2, "No disponible": 3 };
const mobileSnapshot = () => window.matchMedia("(max-width: 767px)").matches;
const subscribeMobile = (notify:()=>void) => { const media=window.matchMedia("(max-width: 767px)");media.addEventListener("change",notify);return ()=>media.removeEventListener("change",notify); };
export function AgendaPage() {
  const mobile=useSyncExternalStore(subscribeMobile,mobileSnapshot,()=>false);
  const client=useQueryClient();
  const contextRef=useRef<HTMLDivElement>(null);
  const nowRef=useRef<HTMLParagraphElement>(null);
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
    const entries = new Map<number,AgendaStaffChoice>((catalog.data ?? []).map(member => [member.id, { id: member.id, name: member.name, condition: member.status === "INACTIVE" ? "Inactivo" : null }]));
    const catalogIds=new Set((catalog.data ?? []).map(member=>member.id));
    // Session-scoped query cache preserves historical references when a filtered day is empty.
    for(const appointments of [...client.getQueriesData<Appointment[]>({queryKey:["appointments",business?.id]}).map(([,data])=>data),day.data]) {
      for (const appointment of appointments ?? []) if(!catalogIds.has(appointment.staffMemberId)) entries.set(appointment.staffMemberId, { id: appointment.staffMemberId, name: appointment.staffMemberName, condition: professionalCondition(appointment) });
    }
    if(filters.staff && !entries.has(Number(filters.staff)))entries.set(Number(filters.staff),{id:Number(filters.staff),name:`Profesional #${filters.staff}`,condition:"No disponible"});
    return [...entries.values()].sort((a,b)=>(a.condition ? staffConditionOrder[a.condition] ?? 3 : 0)-(b.condition ? staffConditionOrder[b.condition] ?? 3 : 0)||a.name.localeCompare(b.name,"es")||a.id-b.id);
  }, [catalog.data, day.data, client, business?.id, filters.staff]);
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
    <AdminPageHeader compact hideOnMobile title="Agenda" description="Consultá los turnos del negocio por día, profesional y estado." />
    {timezone ? <div ref={contextRef} className="sticky top-[var(--admin-mobile-header-height,4.0625rem)] z-20 mb-4 border-b border-outline-variant bg-surface px-5 py-2 md:static md:mb-5 md:border-0 md:p-0" data-testid="agenda-context-bar">
      <AgendaDateNav mobile={mobile} date={date} today={today} onChange={next => navigate(next)} />
      {!mobile ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <AgendaDesktopFilters filters={filters} staff={staff} loading={catalog.isPending || catalog.isFetching} onChange={next=>navigate(date,next)} />
        {selectedHours ? <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant" data-testid="agenda-business-hours">
          <span>{selectedHours.isClosed ? "Negocio cerrado en esta fecha" : `Horario: ${selectedHours.opensAt}–${selectedHours.closesAt}`}</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded-sm border border-outline-variant bg-surface-container-high" />Fuera de horario</span>
        </div> : null}
      </div> : null}
      {mobile ? <>
        <div className="mt-1"><AgendaProfessionals staff={staff} value={filters.staff} loading={catalog.isPending || catalog.isFetching} onChange={next=>navigate(date,{...filters,staff:next})} /></div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <AgendaFiltersDialog key="mobile-state" stateOnly filters={filters} staff={staff} loading={catalog.isPending || catalog.isFetching} error={catalog.isError} retry={()=>void catalog.refetch()} onApply={next=>navigate(date,next)} />
          {date===today && !busy && !error && Boolean(day.data?.length) ? <Button variant="ghost" onClick={()=>{
            const marker=nowRef.current;if(!marker)return;
            marker.style.scrollMarginTop=`${(contextRef.current?.getBoundingClientRect().bottom ?? 65)+12}px`;
            marker.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
            marker.focus({preventScroll:true});
          }}>Ahora</Button> : null}
        </div>
      </> : null}
      {!mobile && hasFilters ? <div role="region" aria-label="Filtros aplicados" tabIndex={0} className="mt-2 flex items-center gap-2 overflow-x-auto py-1 focus-visible:outline-focus-ring [&>button]:shrink-0 md:flex-wrap md:overflow-visible md:py-0">
        {filters.staff ? <AppliedFilterChip label={staff.find(member => String(member.id) === filters.staff)?.name ?? `Profesional #${filters.staff}`} removeLabel="Quitar filtro de profesional" onRemove={() => navigate(date, { ...filters, staff: "" })} /> : null}
        {filters.status !== "ALL" ? <AppliedFilterChip label={statusLabels[filters.status]} removeLabel="Quitar filtro de estado" onRemove={() => navigate(date, { ...filters, status: "ALL" })} /> : null}
        <Button variant="ghost" onClick={() => navigate(date, { staff: "", status: "ALL" })}>Limpiar filtros</Button>
      </div> : null}

    </div> : null}
    <div className="min-w-0 space-y-4 px-5 md:space-y-5 md:px-0">
      {mobile && selectedHours ? <p className="text-xs text-on-surface-variant md:mt-5 md:text-sm" data-testid="agenda-business-hours">{selectedHours.isClosed ? "Negocio cerrado en esta fecha" : `Horario del negocio: ${selectedHours.opensAt}–${selectedHours.closesAt}`}<span className="hidden md:inline"> · Gris: fuera del horario del negocio</span></p> : null}
      {catalog.isError ? <InlineAlert tone="error">No pudimos cargar el selector de profesionales. <Button variant="ghost" onClick={() => void catalog.refetch()}>Reintentar selector</Button></InlineAlert> : null}
      {error ? <InlineAlert tone="error">{forbidden ? "No tenés acceso a la agenda." : interval.isError && !config.isError ? "No pudimos cargar el intervalo de agenda." : hoursFailed ? "No pudimos cargar los horarios del negocio." : "No pudimos cargar la agenda completa."}{!forbidden ? <Button variant="ghost" onClick={() => void (config.isError ? config.refetch() : interval.isError ? interval.refetch() : hours.isError ? hours.refetch() : day.refetch())}>{interval.isError && !config.isError ? "Reintentar intervalo" : hoursFailed ? "Reintentar horarios" : "Reintentar agenda"}</Button> : null}</InlineAlert> : busy ?
        <div role="status" aria-label="Cargando agenda completa" className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div> : day.data?.length ?
        <AgendaResults appointments={day.data} timezone={timezone!} date={date} now={now} slotIntervalMinutes={interval.data!} businessHours={selectedHours!} mobileNowRef={nowRef} /> : <EmptyState icon={<CalendarDays />} title={hasFilters ? "No hay coincidencias" : "No hay turnos este día"} description={hasFilters ? "Probá cambiando o limpiando los filtros." : selectedHours?.isClosed ? "El negocio está cerrado en esta fecha." : "Elegí otra fecha para consultar los turnos."} />}
    </div>
  </AdminPageSection>;
}
