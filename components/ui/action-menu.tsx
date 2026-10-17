"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { useRef, type ReactElement } from "react";

type Props = { trigger: ReactElement; actions: readonly { label: string; onSelect?: () => void; href?: string; danger?: boolean }[] };
export function ActionMenu({ trigger, actions }: Props) {
  const pending = useRef<(() => void) | null>(null);
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-44 rounded-lg border border-outline-variant bg-surface-container-lowest p-1 text-on-surface shadow-soft"
        onCloseAutoFocus={event => {
          const action = pending.current;
          if (!action) return;
          event.preventDefault(); pending.current = null;
          window.requestAnimationFrame(action);
        }}>
        {actions.map(action => <DropdownMenu.Item key={action.label} asChild={Boolean(action.href)} onSelect={() => { pending.current = action.onSelect ?? null; }}
          className={`flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm outline-none data-[highlighted]:bg-primary-fixed ${action.danger ? "text-error data-[highlighted]:text-error" : "data-[highlighted]:text-primary"}`}>
          {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
        </DropdownMenu.Item>)}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
