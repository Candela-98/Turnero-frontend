import { UserRound } from "lucide-react";
import { useLayoutEffect, useRef, type RefObject } from "react";
import type { BusinessHoursDayFormValues } from "@/lib/business-hours/types";
import type { SlotIntervalMinutes } from "@/lib/booking-settings/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { statusLabels, type Appointment } from "@/lib/appointments/api";
import { businessDate, clockTime, relativeDayLabel } from "@/lib/appointments/dates";
import { buildTimeline, groupAppointmentsByStart, MINUTE_HEIGHT, professionalCondition } from "@/lib/appointments/timeline";

export function AgendaAppointmentCard({ appointment: a, timezone, compact = false }: { appointment: Appointment; timezone: string; compact?: boolean }) {
  const nextDay = businessDate(timezone, new Date(a.endsAt)) !== businessDate(timezone, new Date(a.startsAt));
  const condition = professionalCondition(a);
  const description = `${clockTime(a.startsAt, timezone)} – ${clockTime(a.endsAt, timezone)}${nextDay ? " (+1 día)" : ""} · ${a.customerName} · ${a.serviceOfferingName} · ${a.staffMemberName} · ${statusLabels[a.status]}${condition ? ` · ${condition}` : ""}`;
  return <article className={cn("min-w-0 rounded-lg border-l-4 bg-surface-container-lowest shadow-soft", compact ? "h-full space-y-2 overflow-auto p-3 focus-visible:outline-focus-ring" : "space-y-1.5 p-3.5", a.status === "CONFIRMED" || a.status === "COMPLETED" ? "border-tertiary-fixed-dim" : "border-primary")}
    data-testid="agenda-appointment" data-appointment-id={a.id} aria-label={description} title={compact ? description : undefined} tabIndex={compact ? 0 : undefined}>
    <div data-testid="agenda-card-time-status" className={cn("flex flex-wrap items-center justify-between gap-2", compact && "sticky -top-3 z-10 -mx-3 bg-surface-container-lowest px-3 py-1")}><p className="text-sm font-semibold"><time dateTime={a.startsAt}>{clockTime(a.startsAt, timezone)}</time> – <time dateTime={a.endsAt}>{clockTime(a.endsAt, timezone)}</time>{nextDay ? " (+1 día)" : ""}</p><Badge tone={a.status === "PENDING" ? "pending" : a.status === "CONFIRMED" || a.status === "COMPLETED" ? "positive" : "neutral"}>{statusLabels[a.status]}</Badge></div>
    <p className={cn("font-semibold", compact ? "truncate" : "break-words")}>{a.customerName}</p>
    {compact ? <p className="break-words text-sm text-on-surface-variant">{a.serviceOfferingName}</p> :
      <div className="flex min-w-0 items-start gap-1.5 text-sm text-on-surface-variant" data-testid="agenda-appointment-details">
        <UserRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <p className="min-w-0 break-words"><span className="font-medium">{a.staffMemberName}</span>{condition ? <> <Badge tone="neutral">{condition}</Badge></> : null}<span aria-hidden="true"> · </span><span className="sr-only">. Servicio: </span><span>{a.serviceOfferingName}</span></p>
      </div>}
  </article>;
}

export function AgendaResults({ appointments, timezone, date, now, slotIntervalMinutes, businessHours, mobileNowRef }: { appointments: Appointment[]; timezone: string; date: string; now: number | null; slotIntervalMinutes: SlotIntervalMinutes; businessHours: BusinessHoursDayFormValues; mobileNowRef?: RefObject<HTMLParagraphElement|null> }) {
  const timeline = buildTimeline(appointments, timezone, date, now, slotIntervalMinutes, businessHours);
  const boardRef = useRef<HTMLDivElement>(null);
  const positionedSelection = useRef<string | null>(null);
  const selection = `${date}:${timezone}:${slotIntervalMinutes}:${businessHours.isClosed}:${businessHours.opensAt}:${businessHours.closesAt}`;
  const initialScrollTop = ((timeline.opens ?? timeline.start) - timeline.start) * MINUTE_HEIGHT;
  useLayoutEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const position = () => {
      if (desktop.matches && boardRef.current && positionedSelection.current !== selection) {
        boardRef.current.scrollTop = initialScrollTop;
        positionedSelection.current = selection;
      }
    };
    position();
    desktop.addEventListener("change", position);
    return () => desktop.removeEventListener("change", position);
  }, [selection, initialScrollTop]);
  const columns = `80px ${timeline.professionals.map(p => `minmax(${p.width}px, 1fr)`).join(" ")}`;
  const minWidth = 80 + timeline.professionals.reduce((total, p) => total + p.width, 0);
  const axisLabelHeight = 28;
  const height = (timeline.end - timeline.start) * MINUTE_HEIGHT + axisLabelHeight;
  const currentLabel = now === null ? "" : clockTime(new Date(now).toISOString(), timezone);
  const marker = <p ref={mobileNowRef} tabIndex={-1} role="note" aria-label={`Hora actual ${currentLabel}`} className="flex items-center gap-3 text-sm font-semibold text-primary"><span className="size-2 rounded-full bg-primary" />Ahora · {currentLabel}<span className="h-px flex-1 bg-primary" /></p>;
  const mobileGroups = groupAppointmentsByStart(timeline.ordered);
  const mobileMarkerIndex = timeline.current === null ? -1 : mobileGroups.findIndex(group => Date.parse(group.startsAt) >= now!);
  const bandStyle = (band: { start: number; end: number }) => ({ top: (band.start - timeline.start) * MINUTE_HEIGHT, height: (band.end - band.start) * MINUTE_HEIGHT + (band.end === timeline.end ? axisLabelHeight : 0) });
  return <>
    <div className="hidden min-w-0 max-w-full overflow-auto overscroll-contain rounded-xl border border-outline-variant bg-surface-container-lowest focus-visible:outline-focus-ring md:block" style={{ maxHeight: "min(72vh, 900px)" }}
      ref={boardRef} tabIndex={0} role="region" aria-label={`Agenda por profesional, escala de ${slotIntervalMinutes} minutos`} data-testid="desktop-agenda-board">
      <div style={{ minWidth }}>
        <div className="sticky top-0 z-20 grid border-b border-outline-variant bg-surface" style={{ gridTemplateColumns: columns }} data-testid="agenda-professional-headers">
          <div className="sticky left-0 z-30 flex items-center bg-surface p-4 text-sm text-on-surface-variant">Hora</div>
          {timeline.professionals.map(p => <div key={p.id} className="min-w-0 space-y-2 border-l border-outline-variant p-4" data-testid="agenda-professional-header" data-professional-id={p.id}>
            <p className="break-words font-semibold">{p.name}</p>{p.condition ? <Badge tone="neutral">{p.condition}</Badge> : null}
          </div>)}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: columns }}>
          <div className="sticky left-0 z-10 bg-surface-container-lowest" style={{ height }} data-testid="agenda-time-axis" data-slot-interval={slotIntervalMinutes}>
            {timeline.outsideHours.map(band => <div key={band.start} aria-hidden="true" className="absolute inset-x-0 bg-surface-container-high" style={bandStyle(band)} />)}
            {timeline.ticks.map(tick => {
              const repeated = timeline.ticks.filter(other => other.label === tick.label && other.date === tick.date).length > 1;
              const offset = repeated ? new Intl.DateTimeFormat("es", { timeZone: timezone, timeZoneName: "shortOffset" }).formatToParts(tick.instant).find(part => part.type === "timeZoneName")?.value : null;
              return <div key={tick.minute} data-testid="agenda-time-tick" data-minute={tick.minute} className="absolute inset-x-0 border-t border-outline-variant px-2 pt-1 text-xs tabular-nums text-on-surface-variant" style={{ top: (tick.minute - timeline.start) * MINUTE_HEIGHT }}>
                {tick.label}{tick.date !== date ? <span className="block">{relativeDayLabel(date, tick.date)}</span> : null}{offset ? <span className="block">{offset}</span> : null}
              </div>;
            })}
          </div>
          {timeline.professionals.map(p => <div key={p.id} className="relative border-l border-outline-variant" style={{ height }} data-testid="agenda-professional-column">
            {timeline.outsideHours.map(band => <div key={band.start} aria-hidden="true" className="pointer-events-none absolute inset-x-0 flex items-start justify-center bg-surface-container-high px-4 pt-4 text-center text-xs text-on-surface-variant" style={bandStyle(band)} data-testid="agenda-outside-hours" data-start-minute={band.start} data-end-minute={band.end}>
              <span>{businessHours.isClosed ? "Negocio cerrado" : "Fuera del horario del negocio"}</span>
            </div>)}
            {timeline.ticks.map(tick => <div key={tick.minute} aria-hidden="true" className="absolute inset-x-0 border-t border-outline-variant" style={{ top: (tick.minute - timeline.start) * MINUTE_HEIGHT }} />)}
            {p.items.map(item => <div key={item.appointment.id} className="absolute px-1.5 pb-1.5" data-testid="agenda-positioned-appointment"
              style={{ top: (item.start - timeline.start) * MINUTE_HEIGHT, height: (item.end - item.start) * MINUTE_HEIGHT, left: `${100 * item.lane / item.lanes}%`, width: `${100 / item.lanes}%` }}>
              <AgendaAppointmentCard appointment={item.appointment} timezone={timezone} compact />
            </div>)}
          </div>)}
          {timeline.current !== null ? <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: (timeline.current - timeline.start) * MINUTE_HEIGHT }} data-testid="agenda-now-line" role="note" aria-label={`Hora actual ${currentLabel}`}>
            <span className="sticky left-0 rounded-r bg-primary px-2 py-1 text-xs font-semibold tabular-nums text-on-primary">{currentLabel}</span><span className="h-0.5 flex-1 bg-primary" />
          </div> : null}
        </div>
      </div>
    </div>
    <div className="space-y-5 md:hidden" data-testid="mobile-agenda-list">{mobileGroups.map((group, index) => {
      const label = clockTime(group.startsAt, timezone);
      const repeated = mobileGroups.filter(other => clockTime(other.startsAt, timezone) === label).length > 1;
      const offset = repeated ? new Intl.DateTimeFormat("es", { timeZone: timezone, timeZoneName: "shortOffset" }).formatToParts(new Date(group.startsAt)).find(part => part.type === "timeZoneName")?.value : "";
      return <div key={group.startsAt} className="space-y-2">{index === mobileMarkerIndex ? marker : null}<section aria-label={`Turnos de las ${label}${offset ? ` ${offset}` : ""}`} data-testid="agenda-time-group" className="space-y-2">
        <h3 className="flex items-center gap-3 text-sm font-semibold tabular-nums text-on-surface-variant"><time dateTime={group.startsAt}>{label}{offset ? ` ${offset}` : ""}</time><span aria-hidden="true" className="h-px flex-1 bg-outline-variant" /></h3>
        {group.items.map(a => <AgendaAppointmentCard key={a.id} appointment={a} timezone={timezone} />)}
      </section></div>;
    })}{timeline.current !== null && mobileMarkerIndex < 0 ? marker : null}</div>
  </>;
}
