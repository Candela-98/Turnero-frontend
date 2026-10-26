import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  children?: ReactNode;
  compactOnMobile?: boolean;
  hideOnMobile?: boolean;
  compact?: boolean;
};

export function AdminPageHeader({ title, description, children, compactOnMobile = false, hideOnMobile = false, compact = false }: AdminPageHeaderProps) {
  return (
    <header className={cn(hideOnMobile ? "sr-only md:not-sr-only md:mb-8 md:px-0 md:pt-0" : cn("mb-5 px-5 pt-5 md:mb-8 md:px-0 md:pt-0", compactOnMobile && "mb-3 pt-4"), compact && "md:mb-4")}>
      {!compact ? <p className={cn("text-sm font-semibold text-primary", compactOnMobile && "hidden md:block")}>Administración</p> : null}
      <h1 className={cn("text-2xl font-bold tracking-tight", !compact && "mt-1 sm:mt-2 sm:text-4xl")}>{title}</h1>
      <p className={cn("mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant sm:mt-3 sm:text-base sm:leading-7", compactOnMobile && "hidden md:block", compact && "sr-only")}>
        {description}
      </p>
      {children}
    </header>
  );
}
