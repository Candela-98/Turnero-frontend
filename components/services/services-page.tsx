"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock3, Search, Scissors } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge, Button, EmptyState, FilterPill, InlineAlert, Skeleton } from "@/components/ui";
import { getServiceCategories, getServiceOfferings, type ServiceFilters } from "@/lib/service-offerings/api";

const size = 20;
const priceFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

export function ServicesPage() {
  const { business } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ServiceFilters["status"]>("ALL");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

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
    <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 text-on-surface sm:px-6 md:pt-10">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Oferta del negocio</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Servicios</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Consultá los servicios, sus precios y disponibilidad.</p>
      </header>

      <section aria-label="Filtros de servicios" className="mb-6 space-y-4 rounded-xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-wrap gap-2" aria-label="Estado">
          {([ ["ALL", "Todos"], ["ACTIVE", "Activos"], ["INACTIVE", "Inactivos"] ] as const).map(([value, label]) => (
            <FilterPill key={value} active={status === value} onClick={() => changeStatus(value)}>{label}</FilterPill>
          ))}
        </div>
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
          <input aria-label="Buscar por servicio o categoría" className="min-h-11 w-full rounded-lg border border-outline bg-surface-container-lowest pl-10 pr-4 text-sm focus-visible:outline-focus-ring" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por servicio o categoría" type="search" value={search} />
        </div>
        {categories.isError ? <InlineAlert tone="error">No se pudieron cargar las categorías. <Button onClick={() => void categories.refetch()} size="sm" variant="ghost">Reintentar</Button></InlineAlert> : null}
        {categories.data && categories.data.length > 0 ? (
          <div aria-label="Categorías" className="flex flex-wrap gap-2">
            <FilterPill active={!category} onClick={() => changeCategory("")}>Todas las categorías</FilterPill>
            {categories.data.map((item) => <FilterPill active={category === item} key={item} onClick={() => changeCategory(item)}>{item}</FilterPill>)}
          </div>
        ) : null}
      </section>

      {isDebouncing || offerings.isPending ? <div aria-label="Cargando servicios" className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : null}
      {!isDebouncing && offerings.isError ? <InlineAlert tone="error">No se pudieron cargar los servicios. <Button onClick={() => void offerings.refetch()} size="sm" variant="ghost">Reintentar</Button></InlineAlert> : null}
      {!isDebouncing && offerings.data?.data.length === 0 ? (
        <EmptyState icon={<Scissors />} title={hasFilters ? "No encontramos servicios" : "Todavía no hay servicios"} description={hasFilters ? "Probá con otra búsqueda o cambiá los filtros." : "Los servicios que agregues al negocio aparecerán acá."} />
      ) : null}
      {!isDebouncing && offerings.data && offerings.data.data.length > 0 ? (
        <section aria-label="Lista de servicios" className="space-y-3">
          <p aria-live="polite" className="text-sm text-on-surface-variant">{offerings.data.page.total_elements} {offerings.data.page.total_elements === 1 ? "servicio" : "servicios"}</p>
          {offerings.data.data.map((service) => (
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5" key={service.id}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h2 className="min-w-0 text-base font-semibold sm:text-lg">{service.name}</h2><Badge tone={service.status === "ACTIVE" ? "positive" : "neutral"}>{service.status === "ACTIVE" ? "Activo" : "Inactivo"}</Badge></div>
                {service.category ? <p className="mt-1 text-sm text-on-surface-variant">{service.category}</p> : null}
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-outline-variant pt-3 sm:mt-0 sm:min-w-52 sm:justify-end sm:border-0 sm:pt-0">
                <span className="flex items-center gap-1.5 text-sm text-on-surface-variant"><Clock3 aria-hidden="true" className="size-4" />{service.durationMinutes} min</span>
                <span className="font-semibold">{priceFormatter.format(service.priceCents / 100)}</span>
              </div>
            </article>
          ))}
          {offerings.data.page.total_pages > 1 ? (
            <nav aria-label="Paginación de servicios" className="flex items-center justify-between gap-3 pt-4">
              <Button disabled={page === 0} onClick={() => setPage(page - 1)} variant="outline">Anterior</Button>
              <span className="text-center text-sm">Página {page + 1} de {offerings.data.page.total_pages}</span>
              <Button disabled={page + 1 >= offerings.data.page.total_pages} onClick={() => setPage(page + 1)} variant="outline">Siguiente</Button>
            </nav>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
