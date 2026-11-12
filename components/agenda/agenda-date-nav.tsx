import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, IconButton, Input } from "@/components/ui";
import { compactDate, readableDate, shiftDay, validDate } from "@/lib/appointments/dates";
export function AgendaDateNav({ date, today, onChange, mobile = false }: { date: string; today: string; onChange: (date: string) => void; mobile?: boolean }) {
  const isToday = date === today;
  return <section className={mobile ? "min-w-0" : "flex flex-wrap items-center justify-between gap-3"} aria-label="Navegación de fecha">
    <div className={mobile ? "sr-only" : "flex flex-wrap items-center gap-2"}><h2 className="text-lg font-semibold">{readableDate(date)}</h2></div>
    <div className="flex min-w-0 items-end gap-1.5 md:flex-wrap md:gap-2" aria-label="Fecha de la agenda">
      <IconButton label="Día anterior" variant="subtle" onClick={() => onChange(shiftDay(date, -1))}><ChevronLeft /></IconButton>
      {mobile ? <label className="relative min-w-0 flex-1" htmlFor="agenda-date">
        <Input id="agenda-date" aria-label="Fecha" aria-describedby="agenda-date-full" type="date" value={date} className="peer absolute inset-0 z-10 w-full cursor-pointer opacity-0" onClick={event=>{try {event.currentTarget.showPicker?.();} catch { /* Native date input remains usable. */ }}} onChange={event=>{if(validDate(event.target.value))onChange(event.target.value);}} />
        <span aria-hidden="true" className="flex min-h-11 items-center justify-center gap-1 rounded-md border border-outline bg-surface-container-lowest px-1 text-sm font-semibold peer-focus-visible:outline-focus-ring">{compactDate(date)}<ChevronDown className="size-3.5 shrink-0" /></span>
        <span id="agenda-date-full" className="sr-only">{readableDate(date)}</span>
      </label> : <div><label htmlFor="agenda-date" className="sr-only">Fecha</label><Input id="agenda-date" type="date" value={date} onChange={event=>{if(validDate(event.target.value))onChange(event.target.value);}} /></div>}
      <IconButton label="Día siguiente" variant="subtle" onClick={() => onChange(shiftDay(date, 1))}><ChevronRight /></IconButton>
      <Button variant={isToday ? "subtle" : "outline"} className={isToday ? "shrink-0 border border-transparent px-3 text-primary" : "shrink-0 px-3"} aria-current={isToday ? "date" : undefined} onClick={() => onChange(today)}>{isToday ? "Hoy" : "Ir a hoy"}</Button>
    </div>
  </section>;
}
