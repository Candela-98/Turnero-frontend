"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useImperativeHandle, useRef, useState, type Ref } from "react";
import { createPortal } from "react-dom";
import { Button, EmptyState, FilterOptionGroup, FloatingAlert, InlineAlert, Pagination, SaveChangesButton, SearchInput, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { getServiceOfferings, type ServiceOffering } from "@/lib/service-offerings/api";
import { applyStaffServices, refreshStaffServices, staffServiceKeys } from "@/lib/staff-members/service-queries";
import { replaceStaffServices, sameServiceSelection, selectedServiceIds } from "@/lib/staff-members/services";
import type { StaffServicesSaved } from "./staff-services-editor";
import { StaffServiceRow } from "./staff-service-row";

export type StaffServicesHandle = { hasChanges: () => boolean; isSaving: () => boolean };
type Props = {
  ref?: Ref<StaffServicesHandle>; businessId: number; staffId: number; initialSelection: ServiceOffering[];
  footerTarget: HTMLElement | null; onSavingChange: (saving: boolean) => void; onCancel: () => void; onSaved: StaffServicesSaved;
};
export function StaffServicesForm({ ref, businessId, staffId, initialSelection, footerTarget, onSavingChange, onCancel, onSaved }: Props) {
  const [baseline] = useState(initialSelection);
  const [selection, setSelection] = useState(initialSelection);
  const [view, setView] = useState<"catalog" | "selected">(initialSelection.length ? "selected" : "catalog");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);
  const id = useId();
  const client = useQueryClient();
  const dirty = !sameServiceSelection(selection, baseline);
  useImperativeHandle(ref, () => ({ hasChanges: () => dirty, isSaving: () => sending.current }), [dirty]);
  useEffect(() => {
    if (search.trim() === query) return;
    const timeout = window.setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, query]);
  const filters = { q: query, category: "", status: "ACTIVE" as const, page, size: 20 };
  const catalog = useQuery({ queryKey: staffServiceKeys.catalog(businessId, filters), queryFn: ({ signal }) => getServiceOfferings(filters, signal),
    enabled: view === "catalog", refetchOnMount: false, refetchOnWindowFocus: false, retry: false });
  const selectedMatches = selection.filter(service => `${service.name} ${service.category ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "es") || a.id - b.id);
  const total = view === "catalog" ? catalog.data?.page.total_elements ?? 0 : selectedMatches.length;
  const pageCount = view === "catalog" ? catalog.data?.page.total_pages ?? 0 : Math.ceil(total / 20);
  useEffect(() => {
    if (view !== "catalog" || !catalog.data || catalog.isFetching || page === 0 || page < catalog.data.page.total_pages) return;
    const frame = window.requestAnimationFrame(() => setPage(Math.max(0, catalog.data!.page.total_pages - 1)));
    return () => window.cancelAnimationFrame(frame);
  }, [view, catalog.data, catalog.isFetching, page]);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const rows = view === "catalog" ? catalog.data?.data ?? [] : selectedMatches.slice(currentPage * 20, (currentPage + 1) * 20);
  const busy = search.trim() !== query || (view === "catalog" && catalog.isFetching);
  function toggle(service: ServiceOffering) {
    if (sending.current) return;
    setSelection(current => current.some(item => item.id === service.id) ? current.filter(item => item.id !== service.id) : [...current, service]);
  }
  function changeView(next: "catalog" | "selected") { setView(next); setSearch(""); setQuery(""); setPage(0); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || !dirty) return;
    sending.current = true;
    setIsSaving(true);
    onSavingChange(true);
    setError(null);
    try { await replaceStaffServices(staffId, selection); }
    catch (error) {
      setError(error instanceof ApiError && error.status === 409 ? "Un servicio seleccionado pasó a inactivo. Revisá Seleccionados y quitá los servicios que ya no se puedan asignar. Tu selección se conserva."
        : error instanceof ApiError && error.status === 404 ? "El profesional o algún servicio ya no está disponible. Revisá tu selección antes de reintentar."
        : "No pudimos guardar los servicios. Tu selección se conserva; podés reintentar.");
      sending.current = false; setIsSaving(false); onSavingChange(false); return;
    }
    const affected = [...new Set([...selectedServiceIds(baseline), ...selectedServiceIds(selection)])];
    await applyStaffServices(client, businessId, staffId, selection, affected);
    let refreshFailed = false;
    try { await refreshStaffServices(client, businessId, staffId, affected); }
    catch { refreshFailed = true; }
    sending.current = false; setIsSaving(false); onSavingChange(false);
    onSaved(staffId, refreshFailed, affected);
  }
  const actions = <div className="w-full space-y-3">
    {error ? <FloatingAlert placement="dialog" tone="error" title="No pudimos guardar" dismissLabel="Cerrar error" onDismiss={() => setError(null)}>
      <p>{error}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => changeView("selected")}>Revisar selección</Button><Button size="sm" variant="ghost" form={id} type="submit" disabled={isSaving}>Reintentar guardado</Button></div>
    </FloatingAlert> : null}
    <div className="flex items-center justify-between gap-3"><Button variant="ghost" disabled={isSaving} onClick={onCancel}>Cancelar</Button><SaveChangesButton form={id} hasChanges={dirty} isSaving={isSaving} /></div>
  </div>;
  return <><form id={id} onSubmit={submit} className="space-y-4">
    <p className="text-sm text-on-surface-variant">Quitar servicios no modifica los turnos existentes.</p>
    <fieldset disabled={isSaving} className="min-w-0 space-y-4">
      <FilterOptionGroup label="Mostrar servicios" value={view} options={[{ value: "catalog", label: "Catálogo" }, { value: "selected", label: `Seleccionados (${selection.length})` }]} onValueChange={changeView} />
      <SearchInput label="Buscar servicios por nombre o categoría" placeholder="Buscar por nombre o categoría" maxLength={100} value={search} onChange={event => setSearch(event.target.value)} />
      <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" size="sm" disabled={!selection.length} onClick={() => setSelection([])}>Quitar todos</Button><Button variant="ghost" size="sm" disabled={!dirty} onClick={() => { setSelection(baseline); setPage(0); setError(null); }}>Restablecer selección</Button></div>
      <p aria-live="polite" className="text-sm text-on-surface-variant">{selection.length} seleccionados · {total} resultados</p>
      {busy ? <div role="status" aria-label="Buscando servicios"><Skeleton className="h-28 w-full" /></div>
        : view === "catalog" && catalog.isError ? <InlineAlert tone="error" title="No pudimos cargar el catálogo"><Button variant="ghost" onClick={() => void catalog.refetch()}>Reintentar catálogo</Button></InlineAlert>
        : rows.length ? <div className="space-y-2">{rows.map(service => <StaffServiceRow key={service.id} service={service} selected={selection.some(item => item.id === service.id)} disabled={isSaving} onToggle={() => toggle(service)} />)}</div>
        : <EmptyState title={query ? "No encontramos servicios" : view === "selected" ? "No hay servicios seleccionados" : "No hay servicios activos"} description={query ? "Probá con otra búsqueda." : view === "selected" ? "Elegí servicios desde el catálogo." : "Los servicios activos del negocio aparecerán acá."} />}
      {!busy && !(view === "catalog" && catalog.isError) ? <Pagination label="Paginación de servicios del profesional" page={currentPage} pageCount={pageCount} onPageChange={setPage} disabled={isSaving} /> : null}
    </fieldset>
  </form>{footerTarget ? createPortal(actions, footerTarget) : null}</>;
}
