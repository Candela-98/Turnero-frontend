"use client";

import { useState } from "react";
import { Button, FilterButton, FilterOptionGroup, ResponsiveDialog } from "@/components/ui";
import type { CustomerFilters } from "@/lib/customers/api";

type Selection = Pick<CustomerFilters, "status" | "publicBookingBlocked">;
const archiveOptions = [{ value: "ACTIVE", label: "Sin archivar" }, { value: "INACTIVE", label: "Archivados" }, { value: "ALL", label: "Todos" }] as const;
const bookingOptions = [{ value: "ALL", label: "Todas" }, { value: "ALLOWED", label: "Permitidas" }, { value: "BLOCKED", label: "Bloqueadas" }] as const;
export function CustomerFiltersDialog({ status, publicBookingBlocked, onApply }: Selection & { onApply: (filters: Selection) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Selection>({ status, publicBookingBlocked });
  return <ResponsiveDialog open={open} onOpenChange={next => {
    if (next) setDraft({ status, publicBookingBlocked });
    setOpen(next);
  }} title="Filtrar clientes" description="Combiná el archivo y los permisos de reserva pública." closeLabel="Cerrar filtros"
    trigger={<FilterButton count={Number(status !== "ACTIVE") + Number(publicBookingBlocked !== undefined)} />} footer={<>
      <Button variant="ghost" onClick={() => setDraft({ status: "ACTIVE", publicBookingBlocked: undefined })}>Limpiar</Button>
      <Button onClick={() => { onApply(draft); setOpen(false); }}>Aplicar filtros</Button>
    </>}>
    <div className="space-y-5">
      <FilterOptionGroup label="Archivo" value={draft.status} options={archiveOptions} onValueChange={status => setDraft({ ...draft, status })} />
      <FilterOptionGroup label="Reservas públicas" value={draft.publicBookingBlocked === undefined ? "ALL" : draft.publicBookingBlocked ? "BLOCKED" : "ALLOWED"}
        options={bookingOptions} onValueChange={value => setDraft({ ...draft, publicBookingBlocked: value === "ALL" ? undefined : value === "BLOCKED" })} />
    </div>
  </ResponsiveDialog>;
}
