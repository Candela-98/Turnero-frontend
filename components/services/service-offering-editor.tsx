"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ReactElement, type Ref } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, ConfirmDiscardDialog, InlineAlert, ResponsiveDialog, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { getServiceCategories, getServiceOffering, type ServiceOffering } from "@/lib/service-offerings/api";
import { serviceOfferingKeys } from "@/lib/service-offerings/queries";
import { ServiceOfferingForm, type ServiceFormHandle } from "./service-offering-form";

export type ServiceOfferingEditorProps = { id?: number; trigger: ReactElement; onSaved: (service: ServiceOffering, refreshFailed: boolean) => void };

export function ServiceOfferingEditor({ id, trigger, onSaved }: ServiceOfferingEditorProps) {
  const { business } = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
  const form = useRef<ServiceFormHandle>(null);
  function requestClose() {
    if (form.current?.isSaving()) return;
    if (form.current?.hasChanges()) setConfirmDiscard(true);
    else setOpen(false);
  }
  return <>
    <ResponsiveDialog open={open} onOpenChange={next => {
      if (!next) { requestClose(); return; }
      if (id !== undefined && business) client.removeQueries({ queryKey: serviceOfferingKeys.detail(business.id, id), exact: true, type: "inactive" });
      setOpen(true);
    }} trigger={trigger}
      title={id === undefined ? "Nuevo servicio" : "Editar servicio"}
      description="Configurá el nombre, la categoría, la duración y el precio."
      closeLabel="Cerrar formulario" closeDisabled={saving} footer={<div className="w-full" ref={setFooterTarget} />}>
      {open && business ? <EditorContent id={id} businessId={business.id} formRef={form} footerTarget={footerTarget} onSavingChange={setSaving} onCancel={requestClose} onSaved={(service, failed) => { setOpen(false); onSaved(service, failed); }} /> : null}
    </ResponsiveDialog>
    <ConfirmDiscardDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} onDiscard={() => { setConfirmDiscard(false); setOpen(false); }} />
  </>;
}

function EditorContent({ id, businessId, formRef, footerTarget, onSavingChange, onCancel, onSaved }: {
  id?: number; businessId: number; formRef: Ref<ServiceFormHandle>; footerTarget: HTMLElement | null;
  onSavingChange: (saving: boolean) => void; onCancel: () => void; onSaved: ServiceOfferingEditorProps["onSaved"];
}) {
  const client = useQueryClient();
  const detail = useQuery({ queryKey: serviceOfferingKeys.detail(businessId, id), queryFn: ({ signal }) => getServiceOffering(id!, signal), enabled: id !== undefined, staleTime: 0, refetchOnWindowFocus: false });
  const categories = useQuery({ queryKey: serviceOfferingKeys.categories(businessId), queryFn: ({ signal }) => getServiceCategories(signal) });
  if (id !== undefined && detail.isPending) return <div aria-label="Cargando servicio" className="space-y-4"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>;
  if (id !== undefined && detail.isError && !detail.data) {
    const missing = detail.error instanceof ApiError && detail.error.status === 404;
    return <InlineAlert tone="error" title={missing ? "El servicio ya no está disponible" : "No pudimos cargar el servicio"}>
      {missing ? <Button variant="ghost" onClick={() => { void client.invalidateQueries({ queryKey: serviceOfferingKeys.list(businessId) }); onCancel(); }}>Volver al listado</Button> : <Button variant="ghost" onClick={() => void detail.refetch()}>Reintentar</Button>}
    </InlineAlert>;
  }
  return <ServiceOfferingForm ref={formRef} footerTarget={footerTarget} businessId={businessId} service={id === undefined ? undefined : detail.data} categories={categories.data ?? []} onSavingChange={onSavingChange} onCancel={onCancel} onSaved={onSaved} />;
}
