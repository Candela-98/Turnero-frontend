import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full resize-y rounded-md border border-outline bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-soft transition-colors duration-150 placeholder:text-on-surface-variant focus-visible:border-primary focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
