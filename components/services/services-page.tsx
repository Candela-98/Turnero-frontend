"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Scissors } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { AppliedFilterChip, Button, EmptyState, InlineAlert, ListToolbar, Skeleton } from "@/components/ui";
import { getServiceCategories, getServiceOfferings, type ServiceFilters, type ServiceOffering } from "@/lib/service-offerings/api";

import { serviceOfferingKeys } from "@/lib/service-offerings/queries";
import { useServicesFeedback, type ServiceNotice } from "./services-feedback-context";
import { ServiceOfferingEditor } from "./service-offering-editor";

import { ServiceFiltersDialog } from "./service-filters-dialog";
import { ServiceOfferingsList } from "./service-offerings-list";

import { ServiceStatusConfirmation } from "./service-status-confirmation";

const size = 20;

export function ServicesPage() {
  const { business } = useAuth();
  const client = useQueryClient();
  const { notify } = useServicesFeedback();
  const [removingService, setRemovingService] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ServiceFilters["status"]>("ALL");
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (search.trim() === query) return;
    const timeout = window.setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, query]);

  const filters = { q: query, category, status, page, size };
  const categories = useQuery({
    queryKey: serviceOfferingKeys.categories(business?.id),
    queryFn: ({ signal }) => getServiceCategories(signal),
    enabled: Boolean(business),
  });
  const offerings = useQuery({
    queryKey: [...serviceOfferingKeys.list(business?.id), filters],
    queryFn: ({ signal }) => getServiceOfferings(filters, signal),
    enabled: Boolean(business),
  });

  useEffect(() => {
    if (!offerings.data || page < offerings.data.page.total_pages || page === 0) return;
    const frame = window.requestAnimationFrame(() => setPage(Math.max(0, offerings.data!.page.total_pages - 1)));
    return () => window.cancelAnimationFrame(frame);
  }, [offerings.data, page]);

  const changeCategory = (next: string) => { setCategory(next); setPage(0); };
  const changeStatus = (next: ServiceFilters["status"]) => { setStatus(next); setPage(0); };
  const hasFilters = Boolean(query || category || status !== "ALL");
  const isDebouncing = search.trim() !== query;
  function saved(message: ServiceNotice, failed: boolean) {
    notify(message, failed);
    const catalog = client.getQueryData<Awaited<ReturnType<typeof getServiceOfferings>>>([...serviceOfferingKeys.list(business?.id), filters]);
    if (catalog && page >= catalog.page.total_pages) setPage(Math.max(0, catalog.page.total_pages - 1));
    window.requestAnimationFrame(() => {
      if (document.activeElement === document.body) document.getElementById("services-search")?.focus({ preventScroll: true });
    });
  }
  const createAction = <ServiceOfferingEditor trigger={<Button>Nuevo servicio</Button>} onSaved={(_, failed) => saved("created", failed)} />;


  return (
    <AdminPageSection>
      <AdminPageHeader title="Servicios" description="Consultá los servicios, sus precios y disponibilidad."><div className="mt-4">{createAction}</div></AdminPageHeader>
      <div className="px-5 md:px-0">

      <ListToolbar label="Filtros de servicios" search={{
        id: "services-search", label: "Buscar por servicio o categoría", maxLength: 100,
        placeholder: "Buscar por servicio o categoría", value: search, onChange: event => setSearch(event.target.value),
      }} filterAction={
        <ServiceFiltersDialog status={status} category={category} categories={categories.data ?? []} loading={categories.isPending} error={categories.isError} onRetry={() => void categories.refetch()} onApply={(nextStatus, nextCategory) => { setStatus(nextStatus); setCategory(nextCategory); setPage(0); }} />
      } appliedFilters={status !== "ALL" || category ? <>
        {status !== "ALL" ? <AppliedFilterChip label={status === "ACTIVE" ? "Activos" : "Inactivos"} removeLabel="Quitar filtro de estado" onRemove={() => changeStatus("ALL")} /> : null}
        {category ? <AppliedFilterChip label={category} removeLabel={`Quitar categoría ${category}`} onRemove={() => changeCategory("")} /> : null}
      </> : null} />

      {isDebouncing || offerings.isPending ? <div aria-label="Cargando servicios" className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : null}
      {!isDebouncing && offerings.isError ? <InlineAlert tone="error">No se pudieron cargar los servicios. <Button onClick={() => void offerings.refetch()} size="sm" variant="ghost">Reintentar</Button></InlineAlert> : null}
      {!isDebouncing && offerings.data?.data.length === 0 ? (
        <EmptyState action={!hasFilters ? createAction : undefined} icon={<Scissors />} title={hasFilters ? "No encontramos servicios" : "Todavía no hay servicios"} description={hasFilters ? "Probá con otra búsqueda o cambiá los filtros." : "Los servicios que agregues al negocio aparecerán acá."} />
      ) : null}
      {!isDebouncing && offerings.data && offerings.data.data.length > 0 ? (
        <ServiceOfferingsList services={offerings.data.data} total={offerings.data.page.total_elements} page={page} pageCount={page < offerings.data.page.total_pages ? offerings.data.page.total_pages : 0} onPageChange={setPage} renderActions={service => <div className="flex flex-wrap gap-2">
          <Button disabled={changingStatus} variant="ghost" className={service.status === "ACTIVE" ? "text-error" : undefined} aria-label={`${service.status === "ACTIVE" ? "Desactivar" : "Restaurar"} ${service.name}`} onClick={() => { setRemovingService(false); setSelectedService(service); }}>{service.status === "ACTIVE" ? "Desactivar" : "Restaurar"}</Button>
          {service.status === "INACTIVE" ? <Button disabled={changingStatus} variant="ghost" className="text-error" aria-label={`Eliminar ${service.name}`} onClick={() => { setRemovingService(true); setSelectedService(service); }}>Eliminar</Button> : null}
          <ServiceOfferingEditor id={service.id} trigger={<Button disabled={changingStatus} variant="outline" aria-label={`Editar ${service.name}`}>Editar</Button>} onSaved={(_, failed) => saved("updated", failed)} />
        </div>} />
      ) : null}
      </div>
      <ServiceStatusConfirmation removing={removingService} service={selectedService} onClose={() => setSelectedService(null)} onPendingChange={setChangingStatus} />
    </AdminPageSection>
  );
}
