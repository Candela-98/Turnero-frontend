"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminPageHeader, AdminPageSection } from "@/components/layouts";
import { Button, buttonVariants, Card, CardContent, CardHeader, EmptyState, InlineAlert, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { getCustomer, type CustomerSummary } from "@/lib/customers/api";
import { customerKeys } from "@/lib/customers/queries";
import { customerContextSearch, customerIdFromPath, customerListContext } from "@/lib/customers/navigation";
import { CustomerCard } from "./customer-card";
import { CustomerEditor } from "./customer-editor";
import { CustomerStatusConfirmation } from "./customer-status-confirmation";
import type { CustomerAction } from "@/lib/customers/status";
import { useCustomerFeedback } from "./customers-workspace";

export function CustomerDetailPage({ rawId }: { rawId: string }) {
  const { business } = useAuth();
  const params = useSearchParams();
  const id = customerIdFromPath(rawId);
  const back = `/clientes${customerContextSearch(customerListContext(params))}`;
  const { notify } = useCustomerFeedback();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState<{ customer: CustomerSummary; action: CustomerAction } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const detail = useQuery({ queryKey: customerKeys.detail(business?.id, id ?? undefined), queryFn: ({ signal }) => getCustomer(id!, signal),
    enabled: Boolean(business && id), staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false });
  const missing = id === null || (detail.error instanceof ApiError && detail.error.status === 404);
  function restoreFocus() {
    window.requestAnimationFrame(() => {
      const target = trigger.current?.isConnected ? trigger.current : document.getElementById("customer-back");
      target?.focus({ preventScroll: true });
    });
  }
  function closeEditor() { setEditing(false); restoreFocus(); }
  return <AdminPageSection>
    <div className="px-5 pt-5 md:px-0 md:pt-0"><Link id="customer-back" href={back} className={buttonVariants({ variant: "ghost", className: "mb-3" })}><ArrowLeft aria-hidden="true" />Volver a clientes</Link></div>
    <AdminPageHeader title="Detalle del cliente" description="Consultá sus datos de contacto, notas internas y estado." />
    <div className="space-y-4 px-5 md:px-0">
      {missing ? <EmptyState title="Cliente no encontrado" description="No está disponible en este negocio." action={<Link href={back} className={buttonVariants()}>Volver al listado</Link>} />
        : detail.isPending ? <div role="status" aria-label="Cargando detalle del cliente"><Skeleton className="h-48 w-full" /></div>
        : <>
          {detail.isError ? <InlineAlert tone="error" title="No pudimos cargar el cliente">Intentá nuevamente para consultar sus datos. <Button variant="ghost" onClick={() => void detail.refetch()}>Reintentar carga</Button></InlineAlert> : null}
          {detail.data ? <>
            <CustomerCard customer={detail.data} actions={<div className="flex flex-wrap gap-2">
              <Button onClick={event => { trigger.current = event.currentTarget; setEditing(true); }}>Editar datos</Button>
              <Button variant="outline" onClick={event => { trigger.current = event.currentTarget; setConfirming({ customer: detail.data, action: detail.data.status === "ACTIVE" ? "archive" : "restore" }); }}>{detail.data.status === "ACTIVE" ? "Archivar" : "Restaurar"}</Button>
            </div>} />
            <section aria-labelledby="customer-booking-heading"><Card>
              <CardHeader><h2 id="customer-booking-heading" className="text-base font-semibold leading-6">Reservas públicas</h2>
                <p className="text-sm text-on-surface-variant">{detail.data.publicBookingBlocked ? "Bloqueadas. Podés asignarle turnos manualmente; los turnos existentes se conservan." : "Permitidas. Si la ficha está archivada, una reserva pública exitosa la restaura automáticamente."}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {detail.data.publicBookingBlocked && detail.data.publicBookingBlockReason ? <div><h3 className="text-sm font-medium">Motivo interno del bloqueo</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm">{detail.data.publicBookingBlockReason}</p></div> : null}
                <Button variant="outline" onClick={event => { trigger.current = event.currentTarget; setConfirming({ customer: detail.data, action: detail.data.publicBookingBlocked ? "unblock" : "block" }); }}>{detail.data.publicBookingBlocked ? "Desbloquear reservas" : "Bloquear reservas"}</Button>
              </CardContent>
            </Card></section>
            <section aria-labelledby="customer-notes-heading"><Card>
              <CardHeader><h2 id="customer-notes-heading" className="text-base font-semibold leading-6">Notas internas</h2><p className="text-sm text-on-surface-variant">Información interna del negocio; no se muestra al cliente.</p></CardHeader>
              <CardContent><p className="whitespace-pre-wrap break-words text-sm leading-6">{detail.data.internalNotes || "No hay notas internas."}</p></CardContent>
            </Card></section>
          </> : null}
        </>}
    </div>
    {editing && business && id ? <CustomerEditor id={id} businessId={business.id} onClose={closeEditor} onSaved={(saved, failed) => { notify("updated", failed, saved.id); closeEditor(); }} /> : null}
    {confirming ? <CustomerStatusConfirmation customer={confirming.customer} action={confirming.action} restoreFocus={restoreFocus} onClose={() => setConfirming(null)} /> : null}
  </AdminPageSection>;
}
