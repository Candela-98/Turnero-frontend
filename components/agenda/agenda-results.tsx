import { useLayoutEffect, useRef } from "react";
import type { BusinessHoursDayFormValues } from "@/lib/business-hours/types";
import type { SlotIntervalMinutes } from "@/lib/booking-settings/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { statusLabels, type Appointment } from "@/lib/appointments/api";
import { businessDate, clockTime, relativeDayLabel } from "@/lib/appointments/dates";
import { buildTimeline, MINUTE_HEIGHT, professionalCondition } from "@/lib/appointments/timeline";

export function AgendaAppointmentCard({ appointment: a, timezone, compact = false }: { appointment: Appointment; timezone: string; compact?: boolean }) {
  const nextDay = businessDate(timezone, new Date(a.endsAt)) !== businessDate(timezone, new Date(a.startsAt));
  const condition = professionalCondition(a);
  const description = `${clockTime(a.startsAt, timezone)} – ${clockTime(a.endsAt, timezone)}${nextDay ? " (+1 día)" : ""} · ${a.customerName} · ${a.serviceOfferingName} · ${a.staffMemberName} · ${statusLabels[a.status]}${condition ? ` · ${condition}` : ""}`;
  return <article className={cn("min-w-0 space-y-2 rounded-lg border-l-4 bg-surface-container-lowest shadow-soft", compact ? "h-full overflow-auto p-3 focus-visible:outline-focus-ring" : "p-4", a.status === "CONFIRMED" || a.status === "COMPLETED" ? "border-tertiary-fixed-dim" : "border-primary")}
    data-testid="agenda-appointment" data-appointment-id={a.id} aria-label={description} title={compact ? description : undefined} tabIndex={compact ? 0 : undefined}>
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold"><time dateTime={a.startsAt}>{clockTime(a.startsAt, timezone)}</time> – <time dateTime={a.endsAt}>{clockTime(a.endsAt, timezone)}</time>{nextDay ? " (+1 día)" : ""}</p><Badge tone={a.status === "PENDING" ? "pending" : a.status === "CONFIRMED" || a.status === "COMPLETED" ? "positive" : "neutral"}>{statusLabels[a.status]}</Badge></div>
    <p className="break-words font-semibold">{a.customerName}</p>
    <p className="break-words text-sm text-on-surface-variant">{a.serviceOfferingName}</p>
    {!compact ? <div className="flex flex-wrap items-center gap-2"><p className="break-words text-sm text-on-surface-variant">{a.staffMemberName}</p>{condition ? <Badge tone="neutral">{condition}</Badge> : null}</div> : null}
  </article>;
}

export function AgendaResults({ appointments, timezone, date, now, slotIntervalMinutes, businessHours }: { appointments: Appointment[]; timezone: string; date: string; now: number | null; slotIntervalMinutes: SlotIntervalMinutes; businessHours: BusinessHoursDayFormValues }) {
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
  const marker = <p role="note" aria-label={`Hora actual ${currentLabel}`} className="flex items-center gap-3 text-sm font-semibold text-primary"><span className="size-2 rounded-full bg-primary" />Ahora · {currentLabel}<span className="h-px flex-1 bg-primary" /></p>;
  const mobileMarkerIndex = timeline.current === null ? -1 : timeline.ordered.findIndex(a => Date.parse(a.startsAt) >= now!);
  const bandStyle = (band: { start: number; end: number }) => ({ top: (band.start - timeline.start) * MINUTE_HEIGHT, height: (band.end - band.start) * MINUTE_HEIGHT + (band.end === timeline.end ? axisLabelHeight : 0) });
  return <>
    <p className="mb-3 text-sm text-on-surface-variant" data-testid="agenda-business-hours">{businessHours.isClosed ? "Negocio cerrado en esta fecha" : `Horario del negocio: ${businessHours.opensAt}–${businessHours.closesAt}`}<span className="hidden md:inline"> · Gris: fuera del horario del negocio</span></p>
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
    <div className="space-y-4 md:hidden" data-testid="mobile-agenda-list">{timeline.ordered.map((a, index) => <div key={a.id} className="space-y-4">{index === mobileMarkerIndex ? marker : null}<AgendaAppointmentCard appointment={a} timezone={timezone} /></div>)}{timeline.current !== null && mobileMarkerIndex < 0 ? marker : null}</div>
  </>;
}
