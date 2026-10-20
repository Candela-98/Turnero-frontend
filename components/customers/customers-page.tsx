"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { AppliedFilterChip, Button, FloatingAlert, InlineAlert, ListToolbar, Skeleton } from "@/components/ui";
import { getCustomers } from "@/lib/customers/api";
import { customerKeys, refreshCustomers } from "@/lib/customers/queries";
import { useCustomerListNavigation } from "@/lib/customers/use-customer-list-navigation";
import { CustomerFiltersDialog } from "./customer-filters-dialog";
import { CustomersList } from "./customers-list";
import { CustomerEditor } from "./customer-editor";
import { customerNotices, type CustomerNotice } from "./customer-feedback";

export function CustomersLoading() {
  return <div role="status" aria-label="Cargando clientes" className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
}
export function CustomersPage() {
  const { business } = useAuth();
  const client = useQueryClient();
  const [editor, setEditor] = useState<{ id?: number } | null>(null);
  const [notice, setNotice] = useState<{ kind: CustomerNotice; sequence: number } | null>(null);
  const [refreshFailure, setRefreshFailure] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);
  const sequence = useRef(0);
  const trigger = useRef<HTMLElement | null>(null);
  function openEditor(element: HTMLElement, id?: number) {
    trigger.current = element;
    if (id !== undefined && business) client.removeQueries({ queryKey: customerKeys.detail(business.id, id), exact: true, type: "inactive" });
    setEditor({ id });
  }
  function closeEditor() {
    setEditor(null);
    window.requestAnimationFrame(() => {
      const target = trigger.current?.isConnected ? trigger.current : document.getElementById("customer-search");
      target?.focus({ preventScroll: true });
    });
  }
  async function retryRefresh() {
    if (!business || refreshFailure === null || retrying) return;
    setRetrying(true);
    try { await refreshCustomers(client, business.id, refreshFailure); setRefreshFailure(null); }
    catch { /* The write succeeded; retry only reads. */ }
    finally { setRetrying(false); }
  }
  const createAction = <Button onClick={event => openEditor(event.currentTarget)}>Nuevo cliente</Button>;
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
    <AdminPageHeader title="Clientes" description="Consultá los clientes y sus datos de contacto."><div className="mt-4">{createAction}</div></AdminPageHeader>
    {notice ? <FloatingAlert key={notice.sequence} title={customerNotices[notice.kind].title} tone="positive" dismissLabel="Cerrar confirmación" onDismiss={() => setNotice(null)}>{customerNotices[notice.kind].description}</FloatingAlert> : null}
    {editor && business ? <CustomerEditor key={`${business.id}-${editor.id ?? "new"}`} id={editor.id} businessId={business.id} onClose={closeEditor} onSaved={(saved, failed) => {
      setNotice({ kind: editor.id === undefined ? "created" : "updated", sequence: ++sequence.current });
      setRefreshFailure(failed ? saved.id : null);
      closeEditor();
    }} /> : null}
    <div className="px-5 md:px-0">
      {refreshFailure !== null ? <div className="mb-4"><InlineAlert tone="error" title="El cliente se guardó, pero no pudimos actualizar los datos">
        Reintentá la actualización para consultar la información más reciente. <Button variant="ghost" disabled={retrying} onClick={() => void retryRefresh()}>{retrying ? "Actualizando…" : "Reintentar actualización"}</Button>
      </InlineAlert></div> : null}
      <ListToolbar label="Filtros de clientes" search={{ id: "customer-search", label: "Buscar por nombre, teléfono o email", placeholder: "Nombre, teléfono o email", maxLength: 100, value: search, onChange: event => setSearch(event.target.value) }}
        filterAction={<CustomerFiltersDialog status={filters.status} onApply={setStatus} />}
        appliedFilters={filters.status !== "ALL" ? <AppliedFilterChip label={filters.status === "ACTIVE" ? "Activos" : "Inactivos"} removeLabel="Quitar filtro de estado" onRemove={() => setStatus("ALL")} /> : null} />
      {busy ? <CustomersLoading /> : customers.isError ?
        <InlineAlert tone="error" title="No pudimos cargar los clientes">Intentá nuevamente. <Button variant="ghost" size="sm" onClick={() => void customers.refetch()}>Reintentar</Button></InlineAlert> : customers.data ?
        <CustomersList customers={customers.data.data} total={customers.data.page.totalElements} page={filters.page} pageCount={customers.data.page.totalPages}
          filtered={Boolean(filters.q || filters.status !== "ALL")} onPageChange={setPage} emptyAction={createAction}
          renderActions={customer => <Button variant="outline" onClick={event => openEditor(event.currentTarget, customer.id)}>Editar</Button>} /> : null}
    </div>
  </AdminPageSection>;
}
