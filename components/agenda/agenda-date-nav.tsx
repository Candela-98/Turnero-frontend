import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, IconButton, Input } from "@/components/ui";
import { readableDate, shiftDay, validDate } from "@/lib/appointments/dates";
export function AgendaDateNav({ date, today, onChange }: { date: string; today: string; onChange: (date: string) => void }) {
  const isToday = date === today;
  return <section className="space-y-3" aria-label="Navegación de fecha"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold sm:text-xl">{readableDate(date)}</h2>{isToday ? <span className="rounded-full bg-primary-fixed px-3 py-1 text-sm font-medium text-primary">Hoy</span> : null}</div><div className="flex flex-wrap items-end gap-2" aria-label="Fecha de la agenda">
    <IconButton label="Día anterior" variant="subtle" onClick={() => onChange(shiftDay(date, -1))}><ChevronLeft /></IconButton>
    <div className="min-w-0 flex-1 sm:flex-none"><label htmlFor="agenda-date" className="mb-1 block text-sm font-medium">Fecha</label><Input id="agenda-date" className="min-h-11 w-full" type="date" value={date} onChange={event => { if (validDate(event.target.value)) onChange(event.target.value); }} /></div>
    <IconButton label="Día siguiente" variant="subtle" onClick={() => onChange(shiftDay(date, 1))}><ChevronRight /></IconButton>
    <Button variant={isToday ? "subtle" : "outline"} className={isToday ? "border border-transparent text-primary" : undefined} aria-current={isToday ? "date" : undefined} onClick={() => onChange(today)}>Hoy</Button>
  </div></section>;
}
