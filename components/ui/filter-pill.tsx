import * as React from "react";

import { cn } from "@/lib/utils";

export type FilterPillProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: "subtle" | "toolbar";
};

export function FilterPill({
  active = false,
  variant = "subtle",
  children,
  className,
  type = "button",
  ...props
}: FilterPillProps) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "toolbar"
          ? active
            ? "rounded-md bg-primary-fixed px-3 font-semibold text-primary ring-1 ring-inset ring-primary/30"
            : "rounded-md bg-surface-container-lowest px-3 text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:bg-surface-container-low"
          : active
            ? "bg-primary-fixed text-on-primary-fixed"
            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high",
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
