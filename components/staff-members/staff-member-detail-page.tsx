"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { Button, buttonVariants, EmptyState, FloatingAlert, InlineAlert, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { getStaffMember, type StaffMember } from "@/lib/staff-members/api";
import { refreshStaffMembers, staffMemberKeys } from "@/lib/staff-members/queries";
import { staffContextSearch, staffIdFromPath, staffListContext } from "@/lib/staff-members/navigation";
import { staffNotices, type StaffNotice } from "./staff-feedback";
import { StaffMemberCard } from "./staff-member-card";
import { useStaffRemovalFeedback } from "./staff-removal-feedback";
import { StaffStatusConfirmation } from "./staff-status-confirmation";

export function StaffMemberDetailPage({ rawId }: { rawId: string }) {
  const { business, user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const removalFeedback = useStaffRemovalFeedback();
  const [removing, setRemoving] = useState(false);
  const back = `/profesionales${staffContextSearch(staffListContext(params))}`;
  const id = staffIdFromPath(rawId);
  const client = useQueryClient();
  const detail = useQuery({ queryKey: staffMemberKeys.detail(business?.id, id ?? undefined),
    queryFn: ({ signal }) => getStaffMember(id!, signal), enabled: Boolean(business && id),
    staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false });
  const [confirming, setConfirming] = useState<StaffMember | null>(null);
  const [notice, setNotice] = useState<{ kind: StaffNotice; sequence: number } | null>(null);
  const sequence = useRef(0);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  function close() { setConfirming(null); window.requestAnimationFrame(() => document.getElementById("staff-status-action")?.focus({ preventScroll: true })); }
  async function retry() {
    if (!business || !id || retrying) return;
    setRetrying(true);
    try { await refreshStaffMembers(client, business.id, id); setRefreshFailed(false); }
    catch { /* The mutation was confirmed; retry reads only. */ }
    finally { setRetrying(false); }
  }
  const missing = id === null || (detail.error instanceof ApiError && detail.error.status === 404);
  return <AdminPageSection>
    <div className="px-5 pt-5 md:px-0 md:pt-0"><Link href={back} className={buttonVariants({ variant: "ghost", className: "mb-3" })}><ArrowLeft aria-hidden="true" />Volver a profesionales</Link></div>
    <AdminPageHeader title="Detalle del profesional" description="Consultá su perfil y administrá su estado en el equipo." />
    <div className="space-y-4 px-5 md:px-0">
      {missing ? <EmptyState title="Profesional no encontrado" description="No está disponible en este negocio." action={<Link href={back} className={buttonVariants()}>Volver al listado</Link>} />
        : detail.isPending ? <div role="status" aria-label="Cargando detalle del profesional"><Skeleton className="h-48 w-full" /></div>
        : <>
          {detail.isError ? <InlineAlert tone="error">No pudimos cargar el profesional. <Button variant="ghost" onClick={() => void detail.refetch()}>Reintentar carga</Button></InlineAlert> : null}
          {detail.data ? <StaffMemberCard member={detail.data} isCurrentUser={detail.data.userId === user?.id} actions={<>
            <Button id="staff-status-action" variant={detail.data.status === "ACTIVE" ? "outline" : "primary"} onClick={() => { setRemoving(false); setConfirming(detail.data); }}>{detail.data.status === "ACTIVE" ? "Desactivar" : "Reactivar"}</Button>
            {detail.data.status === "INACTIVE" ? <Button variant="outline" onClick={() => { setRemoving(true); setConfirming(detail.data); }}>Eliminar</Button> : null}
          </>} /> : null}
        </>}
      {refreshFailed ? <InlineAlert tone="error">El cambio se guardó, pero no pudimos actualizar los datos. <Button variant="ghost" disabled={retrying} onClick={() => void retry()}>{retrying ? "Actualizando…" : "Reintentar actualización"}</Button></InlineAlert> : null}
    </div>
    {notice ? <FloatingAlert key={notice.sequence} title={staffNotices[notice.kind].title} tone="positive" dismissLabel="Cerrar confirmación" onDismiss={() => setNotice(null)}>{staffNotices[notice.kind].description}</FloatingAlert> : null}
    {confirming ? <StaffStatusConfirmation member={confirming} removing={removing} onClose={close} onSaved={(member, failed, removed) => {
      if (removed) { removalFeedback.notify({ id: member.id, failed }); router.replace(back); return; }
      setNotice({ kind: member.status === "ACTIVE" ? "reactivated" : "deactivated", sequence: ++sequence.current });
      setRefreshFailed(failed);
    }} /> : null}
  </AdminPageSection>;
}
