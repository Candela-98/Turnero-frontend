"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { AppliedFilterChip, Button, EmptyState, InlineAlert, ListToolbar, Skeleton } from "@/components/ui";
import { getStaffMembers, type StaffFilters } from "@/lib/staff-members/api";
import { staffMemberKeys } from "@/lib/staff-members/queries";
import { StaffFiltersDialog } from "./staff-filters-dialog";
import { StaffMembersList } from "./staff-members-list";

export function StaffMembersPage() {
  const { business } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StaffFilters["status"]>("ALL");
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (search.trim() === query) return;
    const timeout = window.setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, query]);
  const filters = { q: query, status, page, size: 20 };
  const members = useQuery({
    queryKey: staffMemberKeys.list(business?.id, filters),
    queryFn: ({ signal }) => getStaffMembers(filters, signal),
    enabled: Boolean(business),
  });
  const busy = search.trim() !== query || members.isFetching || members.isPending;
  const changeStatus = (next: StaffFilters["status"]) => { setStatus(next); setPage(0); };
  return <AdminPageSection>
    <AdminPageHeader title="Profesionales" description="Consultá el equipo, sus roles y especialidades." />
    <div className="px-5 md:px-0">
      <ListToolbar label="Filtros de profesionales" search={{ id: "staff-search", label: "Buscar por nombre, rol o especialidad", placeholder: "Buscar por nombre, rol o especialidad", maxLength: 100, value: search, onChange: event => setSearch(event.target.value) }}
        filterAction={<StaffFiltersDialog status={status} onApply={changeStatus} />}
        appliedFilters={status !== "ALL" ? <AppliedFilterChip label={status === "ACTIVE" ? "Activos" : "Inactivos"} removeLabel="Quitar filtro de estado" onRemove={() => changeStatus("ALL")} /> : null} />
      {busy ? <div role="status" aria-label="Cargando profesionales" className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : members.isError ?
        <InlineAlert tone="error">No se pudieron cargar los profesionales. <Button size="sm" variant="ghost" onClick={() => void members.refetch()}>Reintentar</Button></InlineAlert> : members.data?.data.length === 0 ?
        <EmptyState icon={<Users />} title={query || status !== "ALL" ? "No encontramos profesionales" : "Todavía no hay profesionales"} description={query || status !== "ALL" ? "Probá con otra búsqueda o cambiá los filtros." : "Los profesionales del negocio aparecerán acá."} /> : members.data ?
        <StaffMembersList members={members.data.data} total={members.data.page.total_elements} page={page} pageCount={members.data.page.total_pages} onPageChange={setPage} /> : null}
    </div>
  </AdminPageSection>;
}
