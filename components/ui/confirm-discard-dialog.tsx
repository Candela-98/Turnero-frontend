"use client";

import { ConfirmActionDialog } from "./confirm-action-dialog";

export type ConfirmDiscardDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; onDiscard: () => void };

export function ConfirmDiscardDialog({ open, onOpenChange, onDiscard }: ConfirmDiscardDialogProps) {
  return <ConfirmActionDialog open={open} onOpenChange={onOpenChange} onConfirm={onDiscard} title="¿Descartar los cambios?" description="Los cambios sin guardar se perderán." cancelLabel="Seguir editando" confirmLabel="Descartar" />;
}
