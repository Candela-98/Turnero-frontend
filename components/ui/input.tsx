import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface shadow-soft transition-colors duration-150 placeholder:text-on-surface-variant focus-visible:border-primary focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-70",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
