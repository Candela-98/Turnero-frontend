"use client";
import { useState } from "react";
import { Button, FilterButton, FilterOptionGroup, ResponsiveDialog, InlineAlert } from "@/components/ui";
import { statusLabels, type AgendaFilters } from "@/lib/appointments/api";
export function AgendaFiltersDialog({ filters, staff, loading, error, retry, onApply, stateOnly = false }: {
  filters: AgendaFilters; staff: { id: number; name: string }[]; loading: boolean; error: boolean; retry: () => void; onApply: (filters: AgendaFilters) => void; stateOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  return <ResponsiveDialog open={open} onOpenChange={next => { if (next) setDraft(filters); setOpen(next); }}
    title={stateOnly ? "Filtrar por estado" : "Filtrar agenda"} description={stateOnly ? "Elegí el estado de los turnos." : "Elegí profesional y estado."} closeLabel="Cerrar filtros"
    trigger={<FilterButton label={stateOnly ? `Estado${filters.status !== "ALL" ? `: ${statusLabels[filters.status]}` : ""}` : "Filtros"} count={(stateOnly ? 0 : Number(Boolean(filters.staff))) + Number(filters.status !== "ALL")} />}
    footer={<><Button variant="ghost" onClick={() => setDraft({ staff: stateOnly ? filters.staff : "", status: "ALL" })}>Limpiar</Button><Button onClick={() => { onApply(draft); setOpen(false); }}>Aplicar filtros</Button></>}>
    <div className="space-y-6">
      {!stateOnly ? <FilterOptionGroup label="Profesional" value={draft.staff} onValueChange={staff => setDraft({ ...draft, staff })} searchThreshold={5} searchLabel="Buscar profesional"
        options={[{ value: "", label: "Todos los profesionales", pinned: true }, ...staff.map(member => ({ value: String(member.id), label: member.name }))]}>
        {loading ? <p role="status">Cargando profesionales…</p> : null}
        {error ? <InlineAlert tone="error">No pudimos cargar los profesionales. <Button variant="ghost" onClick={retry}>Reintentar profesionales</Button></InlineAlert> : null}
      </FilterOptionGroup> : null}
      <FilterOptionGroup label="Estado" value={draft.status} onValueChange={status => setDraft({ ...draft, status })}
        options={[{ value: "ALL", label: "Todos los estados" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value: value as AgendaFilters["status"], label }))]} />
    </div>
  </ResponsiveDialog>;
}
