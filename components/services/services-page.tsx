"use client";

import { useQuery } from "@tanstack/react-query";
import { Scissors } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader } from "@/components/layouts";
import { AppliedFilterChip, Button, EmptyState, InlineAlert, ListToolbar, Skeleton } from "@/components/ui";
import { getServiceCategories, getServiceOfferings, type ServiceFilters } from "@/lib/service-offerings/api";

import { ServiceFiltersDialog } from "./service-filters-dialog";
import { ServiceOfferingsList } from "./service-offerings-list";

const size = 20;

export function ServicesPage() {
  const { business } = useAuth();
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
    queryKey: ["service-offering-categories", business?.id],
    queryFn: ({ signal }) => getServiceCategories(signal),
    enabled: Boolean(business),
  });
  const offerings = useQuery({
    queryKey: ["service-offerings", business?.id, filters],
    queryFn: ({ signal }) => getServiceOfferings(filters, signal),
    enabled: Boolean(business),
  });

  const changeCategory = (next: string) => { setCategory(next); setPage(0); };
  const changeStatus = (next: ServiceFilters["status"]) => { setStatus(next); setPage(0); };
  const hasFilters = Boolean(query || category || status !== "ALL");
  const isDebouncing = search.trim() !== query;

  return (
    <section className="mx-auto w-full max-w-4xl pb-8 text-on-surface">
      <AdminPageHeader title="Servicios" description="Consultá los servicios, sus precios y disponibilidad." />
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
        <EmptyState icon={<Scissors />} title={hasFilters ? "No encontramos servicios" : "Todavía no hay servicios"} description={hasFilters ? "Probá con otra búsqueda o cambiá los filtros." : "Los servicios que agregues al negocio aparecerán acá."} />
      ) : null}
      {!isDebouncing && offerings.data && offerings.data.data.length > 0 ? (
        <ServiceOfferingsList services={offerings.data.data} total={offerings.data.page.total_elements} page={page} pageCount={offerings.data.page.total_pages} onPageChange={setPage} />
      ) : null}
      </div>
    </section>
  );
}
