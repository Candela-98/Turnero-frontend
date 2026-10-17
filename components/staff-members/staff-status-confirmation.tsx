"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, ConfirmActionDialog, InlineAlert } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import type { StaffMember } from "@/lib/staff-members/api";
import { refreshStaffMembers, staffMemberKeys } from "@/lib/staff-members/queries";
import { applyStaffRemoval, applyStaffStatus, changeStaffStatus, removeStaffMember, staffStatusError } from "@/lib/staff-members/status";

type Props = { member: StaffMember; removing?: boolean; onClose: () => void; onSaved: (member: StaffMember, refreshFailed: boolean, removed: boolean) => void };
export function StaffStatusConfirmation({ member, removing = false, onClose, onSaved }: Props) {
  const { business } = useAuth();
  const client = useQueryClient();
  const sending = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const restoring = !removing && member.status === "INACTIVE";
  const verb = removing ? "Eliminar" : restoring ? "Reactivar" : "Desactivar";
  function close() { if (!sending.current) onClose(); }
  async function confirm() {
    if (!business || sending.current || missing || (removing && member.status !== "INACTIVE")) return;
    sending.current = true; setPending(true); setError(null);
    let confirmed;
    try {
      if (removing) { await removeStaffMember(member.id); confirmed = member; }
      else confirmed = await changeStaffStatus(member);
    }
    catch (error) {
      setMissing(error instanceof ApiError && error.status === 404);
      setError(removing && error instanceof ApiError && error.status === 409 && error.code === "INVALID_STATE_TRANSITION" ? "El profesional debe estar inactivo para eliminarlo. Actualizá los datos y volvé a intentarlo." : removing && !(error instanceof ApiError && error.status === 409) ? "No pudimos eliminar el profesional. Intentá nuevamente." : removing ? staffStatusError(error).replace("desactivarlo", "eliminarlo") : staffStatusError(error)); sending.current = false; setPending(false); return;
    }
    if (removing) await applyStaffRemoval(client, business.id, member.id);
    else await applyStaffStatus(client, business.id, confirmed);
    onClose();
    let failed = false;
    try { await refreshStaffMembers(client, business.id, removing ? undefined : member.id); } catch { failed = true; }
    onSaved(confirmed, failed, removing);
    sending.current = false; setPending(false);
  }
  return <ConfirmActionDialog open onOpenChange={next => { if (!next) close(); }} onConfirm={() => void confirm()}
    title={`¿${verb} “${member.name}”?`}
    description={removing ? "Se quitará del listado y no podrás restaurarlo desde la app. Se conservarán sus datos y el historial de turnos. Si tiene una cuenta vinculada, esta seguirá existiendo y podrá asociarse a otro perfil profesional." : restoring ? "El profesional volverá a estar activo. Podrá recibir reservas según sus servicios, horarios y las reglas del negocio." : "El profesional quedará inactivo. Se conservarán su perfil, el vínculo con su usuario, los servicios, los horarios y el historial de turnos."}
    confirmLabel={pending ? (removing ? "Eliminando…" : restoring ? "Reactivando…" : "Desactivando…") : verb} pending={pending} confirmDisabled={missing} danger={!restoring}>
    {missing ? <InlineAlert tone="error" title="El profesional ya no está disponible"><Button variant="ghost" onClick={() => {
      client.removeQueries({ queryKey: staffMemberKeys.detail(business?.id, member.id), exact: true });
      void refreshStaffMembers(client, business!.id, member.id).catch(() => {}); onClose();
    }}>Actualizar datos</Button></InlineAlert> : error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
  </ConfirmActionDialog>;
}
