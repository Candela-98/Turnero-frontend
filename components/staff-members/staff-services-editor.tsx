"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState, type Ref } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, ConfirmDiscardDialog, InlineAlert, ResponsiveDialog, Skeleton } from "@/components/ui";
import { getServiceOfferings, type ServiceOffering } from "@/lib/service-offerings/api";
import type { StaffMember } from "@/lib/staff-members/api";
import { staffServiceKeys } from "@/lib/staff-members/service-queries";
import { getStaffServices } from "@/lib/staff-members/services";
import { StaffServicesForm, type StaffServicesHandle } from "./staff-services-form";

export const initialServiceFilters = { q: "", category: "", status: "ACTIVE", page: 0, size: 20 } as const;
export type StaffServicesSaved = (staffId: number, refreshFailed: boolean, affectedIds: number[]) => void;
type Props = { member: StaffMember | null; onClose: () => void; onSaved: StaffServicesSaved };
export function StaffServicesEditor({ member, onClose, onSaved }: Props) {
  const { business } = useAuth();
  const form = useRef<StaffServicesHandle>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
  function requestClose() {
    if (form.current?.isSaving()) return;
    if (form.current?.hasChanges()) setConfirmDiscard(true);
    else onClose();
  }
  return <>
    <ResponsiveDialog open={Boolean(member)} onOpenChange={next => { if (!next) requestClose(); }}
      title="Servicios del profesional" description={member ? `Elegí los servicios de ${member.name}.` : "Elegí sus servicios."}
      closeLabel="Cerrar servicios" closeDisabled={saving} footer={<div className="w-full" ref={setFooterTarget} />}>
      {member && business ? <EditorContent key={member.id} member={member} businessId={business.id} formRef={form} footerTarget={footerTarget}
        onSavingChange={setSaving} onCancel={requestClose} onSaved={(...args) => { onClose(); onSaved(...args); }} /> : null}
    </ResponsiveDialog>
    <ConfirmDiscardDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} onDiscard={() => { setConfirmDiscard(false); onClose(); }} />
  </>;
}
function EditorContent({ member, businessId, formRef, footerTarget, onSavingChange, onCancel, onSaved }: {
  member: StaffMember; businessId: number; formRef: Ref<StaffServicesHandle>; footerTarget: HTMLElement | null;
  onSavingChange: (saving: boolean) => void; onCancel: () => void; onSaved: StaffServicesSaved;
}) {
  const selection = useQuery({ queryKey: staffServiceKeys.selection(businessId, member.id), queryFn: ({ signal }) => getStaffServices(member.id, signal),
    staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false, retry: false });
  const catalog = useQuery({ queryKey: staffServiceKeys.catalog(businessId, initialServiceFilters), queryFn: ({ signal }) => getServiceOfferings(initialServiceFilters, signal),
    staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false, retry: false });
  // Capture a fresh opening snapshot once; later refetches never replace the draft.
  const [initialSelection, setInitialSelection] = useState<ServiceOffering[] | null>(null);
  if (initialSelection === null && selection.isSuccess && catalog.isSuccess && selection.isFetchedAfterMount && catalog.isFetchedAfterMount) {
    setInitialSelection(selection.data);
  }
  if (initialSelection !== null) return <StaffServicesForm ref={formRef} businessId={businessId} staffId={member.id} initialSelection={initialSelection}
    footerTarget={footerTarget} onSavingChange={onSavingChange} onCancel={onCancel} onSaved={onSaved} />;
  if (selection.isFetching || catalog.isFetching) {
    return <div role="status" aria-label="Cargando servicios del profesional"><Skeleton className="h-40 w-full" /></div>;
  }
  return <InlineAlert tone="error" title="No pudimos cargar los servicios">
    <Button variant="ghost" onClick={() => { void selection.refetch(); void catalog.refetch(); }}>Reintentar carga</Button>
    <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
  </InlineAlert>;
}
