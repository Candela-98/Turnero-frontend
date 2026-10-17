"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ellipsis, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { AppliedFilterChip, Button, EmptyState, FloatingAlert, InlineAlert, ListToolbar, Skeleton } from "@/components/ui";
import { getStaffMembers, type StaffFilters, type StaffMember } from "@/lib/staff-members/api";
import { refreshStaffMembers, staffMemberKeys } from "@/lib/staff-members/queries";
import { refreshStaffServices } from "@/lib/staff-members/service-queries";
import { ActionMenu } from "@/components/ui/action-menu";
import { StaffHoursEditor } from "./staff-hours-editor";
import { StaffServicesEditor } from "./staff-services-editor";
import { StaffMemberEditor } from "./staff-member-editor";
import { StaffFiltersDialog } from "./staff-filters-dialog";
import { StaffMembersList } from "./staff-members-list";

export function StaffMembersPage() {
  const { business, user } = useAuth();
  const client = useQueryClient();
  const sequence = useRef(0);
  const [notice, setNotice] = useState<{ title: string; sequence: number } | null>(null);
  const [refreshFailure, setRefreshFailure] = useState<{ id: number; services?: number[] } | null>(null);
  const [servicesMember, setServicesMember] = useState<StaffMember | null>(null);
  const [actionEditor, setActionEditor] = useState<{ kind: "details" | "hours"; member: StaffMember } | null>(null);
  const actionTrigger = useRef<HTMLButtonElement | null>(null);
  const servicesTrigger = useRef<HTMLButtonElement | null>(null);
  const [retrying, setRetrying] = useState(false);
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
  useEffect(() => {
    if (!members.data || page === 0 || page < members.data.page.total_pages) return;
    const frame = window.requestAnimationFrame(() => setPage(Math.max(0, members.data!.page.total_pages - 1)));
    return () => window.cancelAnimationFrame(frame);
  }, [members.data, page]);
  function saved(member: StaffMember, failed: boolean, created: boolean) {
    setNotice({ title: created ? "Profesional creado" : "Profesional actualizado", sequence: ++sequence.current });
    setRefreshFailure(failed ? { id: member.id } : null);
    window.requestAnimationFrame(() => {
      if (document.activeElement === document.body) document.getElementById("staff-search")?.focus({ preventScroll: true });
    });
  }
  async function retryRefresh() {
    if (!business || retrying || refreshFailure === null) return;
    setRetrying(true);
    try {
      if (refreshFailure.services) await refreshStaffServices(client, business.id, refreshFailure.id, refreshFailure.services);
      else await refreshStaffMembers(client, business.id, refreshFailure.id);
      setRefreshFailure(null);
    }
    catch { /* Retry reads only: the write already succeeded. */ }
    finally { setRetrying(false); }
  }
  function closeServices() {
    setServicesMember(null);
    window.requestAnimationFrame(() => {
      const target = servicesTrigger.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
      else document.getElementById("staff-search")?.focus({ preventScroll: true });
    });
  }
  function closeAction() {
    setActionEditor(null);
    window.requestAnimationFrame(() => {
      if (actionTrigger.current?.isConnected) actionTrigger.current.focus({ preventScroll: true });
      else document.getElementById("staff-search")?.focus({ preventScroll: true });
    });
  }
  function openAction(kind: "details" | "hours", member: StaffMember) {
    if (kind === "details" && business) client.removeQueries({ queryKey: staffMemberKeys.detail(business.id, member.id), exact: true, type: "inactive" });
    setActionEditor({ kind, member });
  }
  const createAction = <StaffMemberEditor trigger={<Button>Nuevo profesional</Button>} onSaved={(member, failed) => saved(member, failed, true)} />;
  const busy = search.trim() !== query || members.isFetching || members.isPending;
  const changeStatus = (next: StaffFilters["status"]) => { setStatus(next); setPage(0); };
  return <AdminPageSection>
    <AdminPageHeader title="Profesionales" description="Consultá el equipo, sus roles y especialidades."><div className="mt-4">{createAction}</div></AdminPageHeader>
    {notice ? <FloatingAlert key={notice.sequence} title={notice.title} tone="positive" dismissLabel="Cerrar confirmación" onDismiss={() => setNotice(null)}>Los datos se guardaron correctamente.</FloatingAlert> : null}
    <div className="px-5 md:px-0">
      {refreshFailure !== null ? <div className="mb-4"><InlineAlert tone="error">El cambio se guardó, pero no pudimos actualizar los datos. <Button variant="ghost" disabled={retrying} onClick={() => void retryRefresh()}>{retrying ? "Actualizando…" : "Reintentar actualización"}</Button></InlineAlert></div> : null}
      <ListToolbar label="Filtros de profesionales" search={{ id: "staff-search", label: "Buscar por nombre, rol o especialidad", placeholder: "Buscar por nombre, rol o especialidad", maxLength: 100, value: search, onChange: event => setSearch(event.target.value) }}
        filterAction={<StaffFiltersDialog status={status} onApply={changeStatus} />}
        appliedFilters={status !== "ALL" ? <AppliedFilterChip label={status === "ACTIVE" ? "Activos" : "Inactivos"} removeLabel="Quitar filtro de estado" onRemove={() => changeStatus("ALL")} /> : null} />
      {busy ? <div role="status" aria-label="Cargando profesionales" className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : members.isError ?
        <InlineAlert tone="error">No se pudieron cargar los profesionales. <Button size="sm" variant="ghost" onClick={() => void members.refetch()}>Reintentar</Button></InlineAlert> : members.data?.data.length === 0 ?
        <EmptyState action={!query && status === "ALL" ? createAction : undefined} icon={<Users />} title={query || status !== "ALL" ? "No encontramos profesionales" : "Todavía no hay profesionales"} description={query || status !== "ALL" ? "Probá con otra búsqueda o cambiá los filtros." : "Los profesionales del negocio aparecerán acá."} /> : members.data ?
        <StaffMembersList currentUserId={user?.id} members={members.data.data} total={members.data.page.total_elements} page={page} pageCount={members.data.page.total_pages} onPageChange={setPage} renderActions={member => {
          const servicesLabel = member.serviceCount === 0 ? "Asignar servicios" : member.serviceCount === null ? "Servicios" : `Servicios (${member.serviceCount})`;
          return <>
            <Button variant="outline" aria-label={`${servicesLabel} de ${member.name}`} onClick={event => { servicesTrigger.current = event.currentTarget; setServicesMember(member); }}>{servicesLabel}</Button>
            <ActionMenu trigger={<Button variant="outline" className="size-11 shrink-0 px-0" aria-label={`Más acciones de ${member.name}`} onFocus={event => { actionTrigger.current = event.currentTarget; }}><Ellipsis aria-hidden="true" /></Button>}
              actions={[{ label: "Editar datos", onSelect: () => openAction("details", member) }, { label: "Horarios", onSelect: () => openAction("hours", member) }]} />
          </>;
        }} /> : null}
    </div>
    {actionEditor?.kind === "details" ? <StaffMemberEditor key={actionEditor.member.id} id={actionEditor.member.id} open onOpenChange={next => { if (!next) closeAction(); }} onSaved={(member, failed) => saved(member, failed, false)} /> : null}
    <StaffHoursEditor member={actionEditor?.kind === "hours" ? actionEditor.member : null} onClose={closeAction} onSaved={() => {
      setNotice({ title: "Horarios actualizados", sequence: ++sequence.current });
    }} />
    <StaffServicesEditor member={servicesMember} onClose={closeServices} onSaved={(id, failed, services) => {
      setNotice({ title: "Servicios actualizados", sequence: ++sequence.current });
      setRefreshFailure(failed ? { id, services } : null);
    }} />
  </AdminPageSection>;
}
