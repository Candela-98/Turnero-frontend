import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-none",
  {
    defaultVariants: {
      tone: "neutral",
    },
    variants: {
      tone: {
        error: "bg-error-container text-on-error-container",
        neutral: "bg-surface-container text-on-surface-variant",
        pending: "bg-primary-fixed/70 text-primary",
        positive: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      },
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ className, tone }))} {...props} />;
}
