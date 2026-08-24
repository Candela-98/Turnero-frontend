import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-touch items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors duration-150 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  {
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
    variants: {
      size: {
        lg: "h-12 px-5",
        md: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
      },
      variant: {
        ghost:
          "bg-transparent text-on-surface hover:bg-surface-container-low active:bg-surface-container",
        neutral:
          "bg-surface-container-low text-on-surface shadow-soft hover:bg-surface-container active:bg-surface-container-high",
        outline:
          "border border-outline bg-surface-container-lowest text-on-surface hover:bg-surface-container-low active:bg-surface-container",
        primary:
          "bg-primary text-on-primary shadow-soft hover:bg-on-primary-fixed-variant active:bg-primary",
        secondary:
          "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 active:bg-secondary-container",
        subtle:
          "bg-primary-fixed text-on-primary-fixed shadow-soft hover:bg-primary-fixed-dim active:bg-primary-fixed-dim",
      },
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, size, variant, type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ className, size, variant }))}
      type={type}
      {...props}
    />
  );
}
