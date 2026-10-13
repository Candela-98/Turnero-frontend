"use client";

import { AlertDialog } from "radix-ui";
import { Button } from "./button";

export type ConfirmDiscardDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; onDiscard: () => void };

export function ConfirmDiscardDialog({ open, onOpenChange, onDiscard }: ConfirmDiscardDialogProps) {
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-on-surface/40" />
      <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 text-on-surface shadow-panel">
        <AlertDialog.Title className="text-xl font-semibold">¿Descartar los cambios?</AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm text-on-surface-variant">Los cambios sin guardar se perderán.</AlertDialog.Description>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <AlertDialog.Cancel asChild><Button variant="outline">Seguir editando</Button></AlertDialog.Cancel>
          <AlertDialog.Action asChild><Button onClick={onDiscard}>Descartar</Button></AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}
