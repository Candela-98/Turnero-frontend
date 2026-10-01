"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export type FilterButtonProps = Omit<ButtonProps, "children"> & { count?: number; label?: string };

export function FilterButton({ count = 0, label = "Filtros", className, ...props }: FilterButtonProps) {
  return <Button {...props} variant="outline" className={cn("shrink-0 rounded-lg border-outline-variant md:h-9 md:min-h-9", className)}>
    <SlidersHorizontal aria-hidden="true" />{label}{count > 0 ? <span className="rounded-full bg-primary-fixed px-1.5 text-xs text-primary">{count}</span> : null}
  </Button>;
}
