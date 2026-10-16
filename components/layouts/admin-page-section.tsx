import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type AdminPageSectionProps = ComponentProps<"section"> & {
  withSaveAction?: boolean;
};

/** Admin shell supplies main and navigation spacing; forms also reserve their Save action. */
export function AdminPageSection({ withSaveAction = false, className, ...props }: AdminPageSectionProps) {
  return <section className={cn(
    "mx-auto w-full max-w-4xl pb-8 text-on-surface",
    withSaveAction && "pb-[calc(10.5rem+env(safe-area-inset-bottom))] md:pb-8",
    className,
  )} {...props} />;
}
