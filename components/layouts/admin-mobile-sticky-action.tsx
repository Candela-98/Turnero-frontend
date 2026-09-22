import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminMobileStickyActionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Primary action for an admin mobile section. It deliberately sits above the
 * persistent navigation, whose height is shared through a CSS custom property.
 */
export function AdminMobileStickyAction({ children, className }: AdminMobileStickyActionProps) {
  return (
    <div
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
      className={cn(
        "fixed inset-x-0 z-30 border-t border-outline-variant bg-surface/96 px-5 py-3 backdrop-blur md:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
