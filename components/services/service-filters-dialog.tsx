"use client";

import { useState } from "react";
import { Button, FilterButton, FilterOptionGroup, InlineAlert, ResponsiveDialog, Skeleton } from "@/components/ui";
import type { ServiceFilters } from "@/lib/service-offerings/api";

export type ServiceFiltersDialogProps = {
  status: ServiceFilters["status"];
  category: string;
  categories: string[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onApply: (status: ServiceFilters["status"], category: string) => void;
};

const statusOptions = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Activos" },
  { value: "INACTIVE", label: "Inactivos" },
] as const;

export function ServiceFiltersDialog({ status, category, categories, loading, error, onRetry, onApply }: ServiceFiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftCategory, setDraftCategory] = useState(category);
  const [clearCount, setClearCount] = useState(0);
  const count = Number(status !== "ALL") + Number(Boolean(category));

  return (
    <ResponsiveDialog open={open} onOpenChange={next => {
      if (next) { setDraftStatus(status); setDraftCategory(category); }
      setOpen(next);
    }} title="Filtrar servicios" description="Elegí el estado y la categoría del listado." closeLabel="Cerrar filtros" trigger={<FilterButton count={count} />} footer={<>
      <Button variant="ghost" onClick={() => { setDraftStatus("ALL"); setDraftCategory(""); setClearCount(count => count + 1); }}>Limpiar</Button>
      <Button onClick={() => { onApply(draftStatus, draftCategory); setOpen(false); }}>Aplicar filtros</Button>
    </>}>
      <FilterOptionGroup label="Estado" value={draftStatus} options={statusOptions} onValueChange={setDraftStatus} />
      <FilterOptionGroup key={clearCount} label="Categoría" value={draftCategory} options={[{ value: "", label: "Todas las categorías", pinned: true }, ...categories.map(value => ({ value, label: value }))]} onValueChange={setDraftCategory} searchThreshold={8} searchLabel="Buscar categoría" emptySearchMessage="No encontramos esa categoría.">
        {loading ? <Skeleton aria-label="Cargando categorías" className="mb-3 h-11 w-full" /> : null}
        {error ? <InlineAlert tone="error">No se pudieron cargar las categorías. <Button variant="ghost" size="sm" onClick={onRetry}>Reintentar</Button></InlineAlert> : null}
      </FilterOptionGroup>
    </ResponsiveDialog>
  );
}
