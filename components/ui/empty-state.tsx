import * as React from "react";

import { cn } from "@/lib/utils";

export type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  action?: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  title: string;
};

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-outline bg-surface-container-low px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold leading-6">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
