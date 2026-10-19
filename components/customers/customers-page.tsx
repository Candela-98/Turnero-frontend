"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { AppliedFilterChip, Button, InlineAlert, ListToolbar, Skeleton } from "@/components/ui";
import { getCustomers } from "@/lib/customers/api";
import { customerKeys } from "@/lib/customers/queries";
import { useCustomerListNavigation } from "@/lib/customers/use-customer-list-navigation";
import { CustomerFiltersDialog } from "./customer-filters-dialog";
import { CustomersList } from "./customers-list";

export function CustomersLoading() {
  return <div role="status" aria-label="Cargando clientes" className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
}
export function CustomersPage() {
  const { business } = useAuth();
  const { filters, search, setSearch, setStatus, setPage } = useCustomerListNavigation();
  const customers = useQuery({ queryKey: customerKeys.list(business?.id, filters),
    queryFn: ({ signal }) => getCustomers(filters, signal), enabled: Boolean(business) });
  const outOfRange = Boolean(customers.data && filters.page > 0 && filters.page >= customers.data.page.totalPages);
  useEffect(() => {
    if (!outOfRange || !customers.data) return;
    const frame = window.requestAnimationFrame(() => setPage(Math.max(0, customers.data!.page.totalPages - 1)));
    return () => window.cancelAnimationFrame(frame);
  }, [outOfRange, customers.data, setPage]);
  const busy = search.trim() !== filters.q || customers.isFetching || customers.isPending || outOfRange;
  return <AdminPageSection>
    <AdminPageHeader title="Clientes" description="Consultá los clientes y sus datos de contacto." />
    <div className="px-5 md:px-0">
      <ListToolbar label="Filtros de clientes" search={{ id: "customer-search", label: "Buscar por nombre, teléfono o email", placeholder: "Nombre, teléfono o email", maxLength: 100, value: search, onChange: event => setSearch(event.target.value) }}
        filterAction={<CustomerFiltersDialog status={filters.status} onApply={setStatus} />}
        appliedFilters={filters.status !== "ALL" ? <AppliedFilterChip label={filters.status === "ACTIVE" ? "Activos" : "Inactivos"} removeLabel="Quitar filtro de estado" onRemove={() => setStatus("ALL")} /> : null} />
      {busy ? <CustomersLoading /> : customers.isError ?
        <InlineAlert tone="error" title="No pudimos cargar los clientes">Intentá nuevamente. <Button variant="ghost" size="sm" onClick={() => void customers.refetch()}>Reintentar</Button></InlineAlert> : customers.data ?
        <CustomersList customers={customers.data.data} total={customers.data.page.totalElements} page={filters.page} pageCount={customers.data.page.totalPages}
          filtered={Boolean(filters.q || filters.status !== "ALL")} onPageChange={setPage} /> : null}
    </div>
  </AdminPageSection>;
}
