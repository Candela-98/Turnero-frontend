import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <span className="relative block w-full">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-md border border-outline bg-surface-container-lowest px-3 pr-10 text-sm text-on-surface shadow-soft transition-colors duration-150 focus-visible:border-primary focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-70",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
      />
    </span>
  );
}
