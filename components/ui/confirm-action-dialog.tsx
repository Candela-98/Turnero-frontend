"use client";

import type { ReactNode } from "react";
import { AlertDialog } from "radix-ui";
import { Button } from "./button";

export type ConfirmActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  confirmDisabled?: boolean;
  danger?: boolean;
  onCloseAutoFocus?: (event: Event) => void;
  children?: ReactNode;
};

/** Confirmation remains open until its owner confirms success. Cancel receives initial focus. */
export function ConfirmActionDialog({ open, onOpenChange, onConfirm, title, description, confirmLabel, cancelLabel = "Cancelar", pending = false, confirmDisabled = false, danger = false, onCloseAutoFocus, children }: ConfirmActionDialogProps) {
  return <AlertDialog.Root open={open} onOpenChange={next => { if (!pending) onOpenChange(next); }}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-on-surface/40" />
      <AlertDialog.Content onCloseAutoFocus={onCloseAutoFocus} onEscapeKeyDown={event => { if (pending) event.preventDefault(); }} className="fixed left-1/2 top-1/2 z-[60] max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 text-on-surface shadow-panel">
        <AlertDialog.Title className="break-words text-xl font-semibold">{title}</AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-sm text-on-surface-variant">{description}</AlertDialog.Description>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <AlertDialog.Cancel asChild><Button disabled={pending} variant="outline">{cancelLabel}</Button></AlertDialog.Cancel>
          <AlertDialog.Action asChild><Button disabled={pending || confirmDisabled} variant={danger ? "danger" : "primary"} onClick={event => { event.preventDefault(); onConfirm(); }}>{confirmLabel}</Button></AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}
