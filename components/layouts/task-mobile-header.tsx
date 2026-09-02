import { ChevronLeft, X } from "lucide-react";

import { IconButton } from "@/components/ui";
import { cn } from "@/lib/utils";

export type TaskMobileHeaderProps = {
  action?: "back" | "close";
  className?: string;
  context?: string;
  onAction?: () => void;
  title: string;
};

export function TaskMobileHeader({
  action = "back",
  className,
  context,
  onAction,
  title,
}: TaskMobileHeaderProps) {
  const label = action === "close" ? "Cerrar" : "Volver";

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-outline-variant bg-surface/94 px-4 py-3 backdrop-blur md:hidden",
        className,
      )}
    >
      <IconButton label={label} onClick={onAction} size="sm" variant="ghost">
        {action === "close" ? <X /> : <ChevronLeft />}
      </IconButton>
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold leading-6">{title}</h1>
        {context ? (
          <p className="truncate text-xs leading-4 text-on-surface-variant">{context}</p>
        ) : null}
      </div>
    </header>
  );
}
