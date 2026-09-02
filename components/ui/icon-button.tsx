import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-on-surface transition-colors duration-150 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5",
  {
    defaultVariants: {
      size: "md",
      variant: "neutral",
    },
    variants: {
      size: {
        lg: "size-12",
        md: "size-touch",
        sm: "size-9 rounded-sm [&_svg]:size-4",
      },
      variant: {
        ghost: "bg-transparent hover:bg-surface-container-low active:bg-surface-container",
        neutral:
          "bg-surface-container-low shadow-soft hover:bg-surface-container active:bg-surface-container-high",
        primary: "bg-primary text-on-primary shadow-soft hover:bg-on-primary-fixed-variant",
        subtle: "bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim",
      },
    },
  },
);

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants> & {
    label: string;
  };

export function IconButton({
  children,
  className,
  label,
  size,
  type = "button",
  variant,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(iconButtonVariants({ className, size, variant }))}
      title={label}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
