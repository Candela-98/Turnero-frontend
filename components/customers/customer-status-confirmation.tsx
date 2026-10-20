"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, ConfirmActionDialog, InlineAlert, Textarea } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import type { CustomerSummary } from "@/lib/customers/api";
import { refreshCustomers } from "@/lib/customers/queries";
import { applyCustomerStatus, changeCustomerStatus, type CustomerAction } from "@/lib/customers/status";
import { useCustomerFeedback } from "./customers-workspace";

const copy = {
  archive: { verb: "Archivar", pending: "Archivando…", notice: "archived", error: "No pudimos archivar el cliente", description: "Ya no aparecerá en la lista habitual. Sus datos, notas y turnos se conservarán. Si vuelve a reservar por el enlace público y no está bloqueado, se restaurará automáticamente." },
  restore: { verb: "Restaurar", pending: "Restaurando…", notice: "restored", error: "No pudimos restaurar el cliente", description: "Volverá a aparecer en la lista habitual. Si tiene reservas públicas bloqueadas, el bloqueo se conservará." },
  block: { verb: "Bloquear reservas", pending: "Bloqueando…", notice: "blocked", error: "No pudimos bloquear las reservas", description: "No podrá reservar por el enlace público con el email o teléfono de esta ficha. Sus turnos actuales se conservarán y podés asignarle turnos manualmente." },
  unblock: { verb: "Desbloquear reservas", pending: "Desbloqueando…", notice: "unblocked", error: "No pudimos desbloquear las reservas", description: "Podrá volver a reservar por el enlace público. Si la ficha está archivada, seguirá archivada hasta restaurarla o completar una reserva pública." },
} as const;

export function CustomerStatusConfirmation({ customer, action = customer.status === "ACTIVE" ? "archive" : "restore", onClose, restoreFocus }: {
  customer: CustomerSummary; action?: CustomerAction; onClose: (saved?: boolean) => void; restoreFocus?: () => void;
}) {
  const { business } = useAuth();
  const client = useQueryClient();
  const { notify } = useCustomerFeedback();
  const sending = useRef(false);
  const reasonInput = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");
  const [invalidReason, setInvalidReason] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [missing, setMissing] = useState(false);
  const content = copy[action];
  const missingContact = action === "block" && !customer.email?.trim() && !customer.phoneNumber?.replace(/[^0-9]/g, "");
  function close() { if (!sending.current) onClose(); }
  async function confirm() {
    if (!business || sending.current || missing || missingContact) return;
    if (action === "block" && (!reason.trim() || reason.trim().length > 500)) {
      setInvalidReason(true); reasonInput.current?.focus(); return;
    }
    sending.current = true; setPending(true); setError(false);
    let confirmed;
    try { confirmed = await changeCustomerStatus(customer, action, reason); }
    catch (error) {
      setMissing(error instanceof ApiError && error.status === 404);
      setError(true); sending.current = false; setPending(false); return;
    }
    let failed = false;
    try { await applyCustomerStatus(client, business.id, confirmed); } catch { failed = true; }
    onClose(true);
    try { await refreshCustomers(client, business.id, customer.id); } catch { failed = true; }
    notify(content.notice, failed, customer.id);
  }
  return <ConfirmActionDialog open onOpenChange={next => { if (!next) close(); }} onConfirm={() => void confirm()}
    onCloseAutoFocus={restoreFocus ? event => { event.preventDefault(); restoreFocus(); } : undefined}
    title={`¿${content.verb}${action === "block" || action === "unblock" ? " para" : " a"} “${customer.name}”?`} description={content.description}
    confirmLabel={pending ? content.pending : content.verb} danger={action === "archive" || action === "block"} pending={pending} confirmDisabled={missing || missingContact}>
    {action === "block" ? <div className="space-y-3">
      <p className="text-sm text-on-surface-variant">Los contactos compartidos también quedan alcanzados. Usar otros contactos puede eludir el bloqueo; no verifica la identidad de la persona.</p>
      {missingContact ? <InlineAlert tone="error" title="Falta un contacto">Agregá un email o teléfono válido desde Editar antes de bloquear.</InlineAlert> : null}
      <div className="space-y-2"><label htmlFor="customer-block-reason" className="block text-sm font-medium">Motivo interno</label>
        <Textarea ref={reasonInput} id="customer-block-reason" value={reason} maxLength={500} disabled={pending} aria-invalid={invalidReason}
          aria-describedby={`customer-block-help${invalidReason ? " customer-block-error" : ""}`} onChange={event => { setReason(event.target.value); setInvalidReason(false); }} />
        <p id="customer-block-help" className="text-sm text-on-surface-variant">Solo lo verá el negocio. Hasta 500 caracteres.</p>
        {invalidReason ? <p id="customer-block-error" className="text-sm text-error">Ingresá un motivo de hasta 500 caracteres.</p> : null}
      </div>
    </div> : null}
    {missing ? <InlineAlert tone="error" title="El cliente ya no está disponible">
      <p>Actualizá los datos para consultar los clientes disponibles.</p>
      <Button variant="ghost" onClick={() => { void refreshCustomers(client, business!.id, customer.id).catch(() => {}); onClose(); }}>Actualizar datos</Button>
    </InlineAlert> : error ? <InlineAlert tone="error" title={content.error}>Revisá los datos e intentá nuevamente.</InlineAlert> : null}
  </ConfirmActionDialog>;
}
