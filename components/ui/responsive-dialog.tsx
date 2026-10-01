"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { Button } from "./button";

export type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  title: string;
  description: string;
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Controlled dialog: centered on desktop, bottom panel on mobile. */
export function ResponsiveDialog({ open, onOpenChange, trigger, title, description, closeLabel = "Cerrar diálogo", children, footer }: ResponsiveDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-on-surface/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border border-outline-variant bg-surface-container-lowest text-on-surface shadow-soft md:bottom-auto md:left-1/2 md:top-1/2 md:w-[480px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5">
            <div>
              <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-on-surface-variant">{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button aria-label={closeLabel} variant="ghost" className="size-11 shrink-0 px-0"><X aria-hidden="true" /></Button></Dialog.Close>
          </div>
          <div className="min-h-0 space-y-6 overflow-y-auto p-5">{children}</div>
          {footer ? <div className="flex items-center justify-between gap-3 border-t border-outline-variant p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
