import * as React from "react";

import { cn } from "@/lib/utils";

export type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  initials: string;
  imageUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const avatarSizes = {
  lg: "size-12 text-base",
  md: "size-10 text-sm",
  sm: "size-8 text-xs",
};

export function Avatar({
  className,
  imageUrl,
  initials,
  name,
  size = "md",
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-fixed font-semibold text-on-primary-fixed",
        avatarSizes[size],
        className,
      )}
      title={name}
      {...props}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} className="size-full object-cover" src={imageUrl} />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}
