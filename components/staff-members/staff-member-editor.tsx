"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ReactElement, type Ref } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, ConfirmDiscardDialog, InlineAlert, ResponsiveDialog, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { getMyStaffMember, getStaffMember, type StaffMember } from "@/lib/staff-members/api";
import { staffMemberKeys } from "@/lib/staff-members/queries";
import { StaffMemberForm, type StaffFormHandle } from "./staff-member-form";

export type StaffMemberEditorProps = { id?: number; trigger: ReactElement; onSaved: (member: StaffMember, refreshFailed: boolean) => void };

export function StaffMemberEditor({ id, trigger, onSaved }: StaffMemberEditorProps) {
  const { business, user } = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
  const form = useRef<StaffFormHandle>(null);
  function requestClose() {
    if (form.current?.isSaving()) return;
    if (form.current?.hasChanges()) setConfirmDiscard(true);
    else setOpen(false);
  }
  return <>
    <ResponsiveDialog open={open} onOpenChange={next => {
      if (!next) { requestClose(); return; }
      if (id !== undefined && business) client.removeQueries({ queryKey: staffMemberKeys.detail(business.id, id), exact: true, type: "inactive" });
      if (id === undefined && business && user) client.removeQueries({ queryKey: staffMemberKeys.userLink(business.id, user.id), exact: true, type: "inactive" });
      setOpen(true);
    }} trigger={trigger}
      title={id === undefined ? "Nuevo profesional" : "Editar profesional"}
      description="Completá el nombre, el rol y la especialidad."
      closeLabel="Cerrar formulario" closeDisabled={saving} footer={<div className="w-full" ref={setFooterTarget} />}>
      {open && business && user ? <EditorContent id={id} businessId={business.id} userId={user.id} formRef={form} footerTarget={footerTarget} onSavingChange={setSaving} onCancel={requestClose} onSaved={(member, failed) => { setOpen(false); onSaved(member, failed); }} /> : null}
    </ResponsiveDialog>
    <ConfirmDiscardDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} onDiscard={() => { setConfirmDiscard(false); setOpen(false); }} />
  </>;
}

function EditorContent({ id, businessId, userId, formRef, footerTarget, onSavingChange, onCancel, onSaved }: {
  id?: number; businessId: number; userId: number; formRef: Ref<StaffFormHandle>; footerTarget: HTMLElement | null;
  onSavingChange: (saving: boolean) => void; onCancel: () => void; onSaved: StaffMemberEditorProps["onSaved"];
}) {
  const client = useQueryClient();
  const link = useQuery({ queryKey: staffMemberKeys.userLink(businessId, userId), queryFn: ({ signal }) => getMyStaffMember(signal), enabled: id === undefined, staleTime: 0, refetchOnWindowFocus: false });
  const detail = useQuery({ queryKey: staffMemberKeys.detail(businessId, id), queryFn: ({ signal }) => getStaffMember(id!, signal), enabled: id !== undefined, staleTime: 0, refetchOnWindowFocus: false });
  if (id !== undefined && detail.isPending) return <div aria-label="Cargando profesional" className="space-y-4"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>;
  if (id !== undefined && detail.isError && !detail.data) {
    const missing = detail.error instanceof ApiError && detail.error.status === 404;
    return <InlineAlert tone="error" title={missing ? "El profesional ya no está disponible" : "No pudimos cargar el profesional"}>
      {missing ? <Button variant="ghost" onClick={() => { void client.invalidateQueries({ queryKey: staffMemberKeys.all(businessId) }); onCancel(); }}>Volver al listado</Button> : <Button variant="ghost" onClick={() => void detail.refetch()}>Reintentar</Button>}
    </InlineAlert>;
  }
  return <StaffMemberForm ref={formRef} footerTarget={footerTarget} businessId={businessId} userId={userId} linkedMember={link.data} checkingLink={link.isFetching || link.isPending} linkError={link.isError} onRetryLink={() => void link.refetch()} member={id === undefined ? undefined : detail.data} onSavingChange={onSavingChange} onCancel={onCancel} onSaved={onSaved} />;
}
