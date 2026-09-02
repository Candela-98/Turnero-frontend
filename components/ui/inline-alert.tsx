import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inlineAlertVariants = cva("rounded-md border px-4 py-3 text-sm leading-6", {
  defaultVariants: {
    tone: "neutral",
  },
  variants: {
    tone: {
      error: "border-error/25 bg-error-container text-on-error-container",
      neutral: "border-outline-variant bg-surface-container-low text-on-surface",
      pending: "border-primary-fixed-dim bg-primary-fixed/40 text-on-primary-fixed-variant",
      positive: "border-tertiary-fixed-dim bg-tertiary-fixed text-on-tertiary-fixed-variant",
    },
  },
});

export type InlineAlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof inlineAlertVariants> & {
    title?: string;
  };

export function InlineAlert({ children, className, title, tone, ...props }: InlineAlertProps) {
  return (
    <div className={cn(inlineAlertVariants({ className, tone }))} role="status" {...props}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}
