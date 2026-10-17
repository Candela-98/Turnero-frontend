"use client";

import { useState } from "react";
import { Button, FilterButton, FilterOptionGroup, ResponsiveDialog } from "@/components/ui";
import type { StaffFilters } from "@/lib/staff-members/api";

type Status = StaffFilters["status"];
const options = [{ value: "ALL", label: "Todos" }, { value: "ACTIVE", label: "Activos" }, { value: "INACTIVE", label: "Inactivos" }] as const;

export function StaffFiltersDialog({ status, onApply }: { status: Status; onApply: (status: Status) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(status);
  return <ResponsiveDialog open={open} onOpenChange={next => {
    if (next) setDraft(status);
    setOpen(next);
  }} title="Filtrar profesionales" description="Elegí el estado del listado." closeLabel="Cerrar filtros"
    trigger={<FilterButton count={Number(status !== "ALL")} />} footer={<>
      <Button variant="ghost" onClick={() => setDraft("ALL")}>Limpiar</Button>
      <Button onClick={() => { onApply(draft); setOpen(false); }}>Aplicar filtros</Button>
    </>}>
    <FilterOptionGroup label="Estado" value={draft} options={options} onValueChange={setDraft} />
  </ResponsiveDialog>;
}
