"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { AppliedFilterChip, Button, InlineAlert, ListToolbar, Skeleton } from "@/components/ui";
import { getCustomers, type CustomerSummary } from "@/lib/customers/api";
import { customerKeys } from "@/lib/customers/queries";
import { useCustomerListNavigation } from "@/lib/customers/use-customer-list-navigation";
import { CustomerFiltersDialog } from "./customer-filters-dialog";
import { CustomersList } from "./customers-list";
import { CustomerEditor } from "./customer-editor";
import { useCustomerFeedback } from "./customers-workspace";
import { CustomerStatusConfirmation } from "./customer-status-confirmation";
import { ActionMenu } from "@/components/ui/action-menu";
import { Ellipsis } from "lucide-react";
import type { CustomerAction } from "@/lib/customers/status";
import { customerContextSearch } from "@/lib/customers/navigation";

export function CustomersLoading() {
  return <div role="status" aria-label="Cargando clientes" className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
}
export function CustomersPage() {
  const { business } = useAuth();
  const client = useQueryClient();
  const [editor, setEditor] = useState<{ id?: number } | null>(null);
  const { notify } = useCustomerFeedback();
  const [confirming, setConfirming] = useState<{ customer: CustomerSummary; action: CustomerAction } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  function openEditor(element: HTMLElement, id?: number) {
    trigger.current = element;
    if (id !== undefined && business) client.removeQueries({ queryKey: customerKeys.detail(business.id, id), exact: true, type: "inactive" });
    setEditor({ id });
  }
  function closeEditor() {
    setEditor(null);
    restoreFocus();
  }
  function restoreFocus() {
    window.requestAnimationFrame(() => {
      const target = trigger.current?.isConnected ? trigger.current : document.getElementById("customer-search");
      target?.focus({ preventScroll: true });
    });
  }
  const createAction = <Button onClick={event => openEditor(event.currentTarget)}>Nuevo cliente</Button>;
  const { filters, search, setSearch, setStatus, setPage, setFilters } = useCustomerListNavigation();
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
    {confirming ? <CustomerStatusConfirmation customer={confirming.customer} action={confirming.action} restoreFocus={restoreFocus} onClose={saved => { if (saved) trigger.current = null; setConfirming(null); }} /> : null}
    {editor && business ? <CustomerEditor key={`${business.id}-${editor.id ?? "new"}`} id={editor.id} businessId={business.id} onClose={closeEditor} onSaved={(saved, failed) => {
      notify(editor.id === undefined ? "created" : "updated", failed, saved.id);
      closeEditor();
    }} /> : null}
    <div className="px-5 md:px-0">
      <ListToolbar label="Filtros de clientes" search={{ id: "customer-search", label: "Buscar por nombre, teléfono o email", placeholder: "Nombre, teléfono o email", maxLength: 100, value: search, onChange: event => setSearch(event.target.value) }}
        filterAction={<CustomerFiltersDialog status={filters.status} publicBookingBlocked={filters.publicBookingBlocked} onApply={setFilters} />}
        appliedFilters={<>
          {filters.status !== "ACTIVE" ? <AppliedFilterChip label={filters.status === "ALL" ? "Todos los clientes" : "Archivados"} removeLabel="Quitar filtro de archivo" onRemove={() => setStatus("ACTIVE")} /> : null}
          {filters.publicBookingBlocked !== undefined ? <AppliedFilterChip label={filters.publicBookingBlocked ? "Reservas bloqueadas" : "Reservas permitidas"} removeLabel="Quitar filtro de reservas públicas" onRemove={() => setFilters({ status: filters.status, publicBookingBlocked: undefined })} /> : null}
        </>} />
      {busy ? <CustomersLoading /> : customers.isError ?
        <InlineAlert tone="error" title="No pudimos cargar los clientes">Intentá nuevamente. <Button variant="ghost" size="sm" onClick={() => void customers.refetch()}>Reintentar</Button></InlineAlert> : customers.data ?
        <CustomersList customers={customers.data.data} total={customers.data.page.totalElements} page={filters.page} pageCount={customers.data.page.totalPages}
          filtered={Boolean(filters.q || filters.status !== "ACTIVE" || filters.publicBookingBlocked !== undefined)} onPageChange={setPage} emptyAction={createAction}
          renderActions={customer => <div className="flex items-center gap-2">
            <Button variant="outline" onClick={event => openEditor(event.currentTarget, customer.id)}>Editar</Button>
            <ActionMenu trigger={<Button id={`customer-actions-${customer.id}`} variant="outline" className="size-11 px-0" aria-label={`Más acciones de ${customer.name}`}><Ellipsis aria-hidden="true" /></Button>} actions={[
              { label: "Ver detalle", href: `/clientes/${customer.id}${customerContextSearch(filters)}` },
              { label: customer.status === "ACTIVE" ? "Archivar" : "Restaurar", danger: customer.status === "ACTIVE", onSelect: () => {
                trigger.current = document.getElementById(`customer-actions-${customer.id}`); setConfirming({ customer, action: customer.status === "ACTIVE" ? "archive" : "restore" });
              } },
              { label: customer.publicBookingBlocked ? "Desbloquear reservas" : "Bloquear reservas", danger: !customer.publicBookingBlocked, onSelect: () => {
                trigger.current = document.getElementById(`customer-actions-${customer.id}`);
                setConfirming({ customer, action: customer.publicBookingBlocked ? "unblock" : "block" });
              } },
            ]} />
          </div>} /> : null}
    </div>
  </AdminPageSection>;
}
