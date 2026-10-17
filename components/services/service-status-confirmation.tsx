"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { ConfirmActionDialog, InlineAlert } from "@/components/ui";
import { deactivateServiceOffering, removeServiceOffering, restoreServiceOffering, type ServiceOffering } from "@/lib/service-offerings/api";
import { applyServiceRemoval, applyServiceStatus, refreshServiceCatalog } from "@/lib/service-offerings/queries";
import { useServicesFeedback } from "./services-feedback-context";

export function ServiceStatusConfirmation({ service, removing = false, onClose, onPendingChange }: { service: ServiceOffering | null; removing?: boolean; onClose: () => void; onPendingChange: (pending: boolean) => void }) {
  const { business } = useAuth();
  const client = useQueryClient();
  const { notify } = useServicesFeedback();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);
  const restoring = !removing && service?.status === "INACTIVE";
  const verb = removing ? "eliminar" : restoring ? "restaurar" : "desactivar";

  function close() { if (!sending.current) { setError(null); onClose(); } }

  async function confirm() {
    if (!service || !business || sending.current || (removing && service.status !== "INACTIVE")) return;
    sending.current = true;
    setPending(true); onPendingChange(true); setError(null);
    try {
      let confirmed = service;
      try {
        if (removing) await removeServiceOffering(service.id);
        else if (restoring) confirmed = await restoreServiceOffering(service.id);
        else await deactivateServiceOffering(service.id);
      } catch {
        setError(`No pudimos ${verb} el servicio. Intentá nuevamente.`);
        return;
      }
      if (removing) await applyServiceRemoval(client, business.id, service.id);
      else await applyServiceStatus(client, business.id, confirmed, restoring ? "ACTIVE" : "INACTIVE");
      onClose();
      let failed = false;
      try { await refreshServiceCatalog(client, business.id, service.id); }
      catch { failed = true; }
      notify(removing ? "removed" : restoring ? "restored" : "deactivated", failed, service.id);
      window.requestAnimationFrame(() => {
        if (document.activeElement === document.body) document.getElementById("services-search")?.focus({ preventScroll: true });
      });
    } finally {
      sending.current = false; setPending(false); onPendingChange(false);
    }
  }

  return <ConfirmActionDialog open={Boolean(service)} onOpenChange={open => { if (!open) close(); }} onConfirm={() => void confirm()} title={`¿${removing ? "Eliminar" : restoring ? "Restaurar" : "Desactivar"} “${service?.name ?? ""}”?`} description={removing ? "Se quitará del catálogo y no podrás restaurarlo. Los turnos anteriores conservarán su información." : restoring ? "El servicio volverá a estar activo y disponible para ofrecerlo." : "El servicio quedará inactivo. Se conservarán sus datos y el historial de turnos."} confirmLabel={pending ? (removing ? "Eliminando…" : restoring ? "Restaurando…" : "Desactivando…") : (removing ? "Eliminar" : restoring ? "Restaurar" : "Desactivar")} pending={pending} danger={!restoring}>
    {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
  </ConfirmActionDialog>;
}
