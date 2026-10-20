"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type Ref } from "react";
import { Button, ConfirmDiscardDialog, InlineAlert, ResponsiveDialog, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { getCustomer, type CustomerDetail } from "@/lib/customers/api";
import { customerKeys } from "@/lib/customers/queries";
import { CustomerForm, type CustomerFormHandle } from "./customer-form";

type Props = { id?: number; businessId: number; onClose: () => void; onSaved: (customer: CustomerDetail, refreshFailed: boolean) => void };

export function CustomerEditor({ id, businessId, onClose, onSaved }: Props) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
  const form = useRef<CustomerFormHandle>(null);
  function requestClose() {
    if (form.current?.isSaving()) return;
    if (form.current?.hasChanges()) setConfirmDiscard(true);
    else onClose();
  }
  return <>
    <ResponsiveDialog open onOpenChange={next => { if (!next) requestClose(); }}
      title={id === undefined ? "Nuevo cliente" : "Editar cliente"}
      description="Completá sus datos de contacto y las notas internas del negocio."
      closeLabel="Cerrar formulario" closeDisabled={saving} footer={<div className="w-full" ref={setFooterTarget} />}>
      <EditorContent id={id} businessId={businessId} formRef={form} footerTarget={footerTarget}
        onSavingChange={setSaving} onCancel={requestClose} onSaved={onSaved} />
    </ResponsiveDialog>
    <ConfirmDiscardDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} onDiscard={onClose} />
  </>;
}

function EditorContent({ id, businessId, formRef, footerTarget, onSavingChange, onCancel, onSaved }: Omit<Props, "onClose"> & {
  formRef: Ref<CustomerFormHandle>; footerTarget: HTMLElement | null; onSavingChange: (saving: boolean) => void; onCancel: () => void;
}) {
  const client = useQueryClient();
  const detail = useQuery({ queryKey: customerKeys.detail(businessId, id), queryFn: ({ signal }) => getCustomer(id!, signal),
    enabled: id !== undefined, staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false });
  const [initialCustomer, setInitialCustomer] = useState<CustomerDetail | null>(null);
  if (id !== undefined && !initialCustomer && detail.isSuccess && detail.isFetchedAfterMount) setInitialCustomer(detail.data);
  if (id !== undefined && !initialCustomer && (detail.isPending || detail.isFetching || !detail.isFetchedAfterMount)) return <div role="status" aria-label="Cargando cliente" className="space-y-4"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>;
  if (id !== undefined && !initialCustomer && detail.isError) {
    const missing = detail.error instanceof ApiError && detail.error.status === 404;
    return <InlineAlert tone="error" title={missing ? "El cliente ya no está disponible" : "No pudimos cargar el cliente"}>
      <p>{missing ? "Volvé al listado para consultar los clientes disponibles." : "Intentá nuevamente para cargar sus datos."}</p>
      {missing ? <Button variant="ghost" onClick={() => { void client.invalidateQueries({ queryKey: customerKeys.all(businessId) }); onCancel(); }}>Volver al listado</Button> :
        <Button variant="ghost" onClick={() => void detail.refetch()}>Reintentar</Button>}
    </InlineAlert>;
  }
  return <CustomerForm ref={formRef} footerTarget={footerTarget} businessId={businessId} customer={id === undefined ? undefined : initialCustomer ?? detail.data}
    onSavingChange={onSavingChange} onCancel={onCancel} onSaved={onSaved} />;
}
