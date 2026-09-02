import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";

export type BookingPublicShellProps = {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  progress?: ReactNode;
};

export function BookingPublicShell({
  children,
  className,
  footer,
  progress,
}: BookingPublicShellProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-20 border-b border-outline-variant bg-surface/94 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-lg items-center justify-between gap-4 px-4 py-3">
          <BrandMark subtitle="Reservas online" />
          {progress ? <div className="shrink-0">{progress}</div> : null}
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-lg px-4 pb-28 pt-5", className)}>{children}</main>

      {footer ? (
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface/96 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto w-full max-w-lg">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
