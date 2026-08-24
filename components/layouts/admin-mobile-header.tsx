import { Bell, CircleHelp } from "lucide-react";

import { Avatar, IconButton } from "@/components/ui";
import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";

export type AdminMobileHeaderProps = {
  className?: string;
  subtitle: string;
  userInitials?: string;
  userName?: string;
};

export function AdminMobileHeader({
  className,
  subtitle,
  userInitials = "MR",
  userName = "Mateo Ruiz",
}: AdminMobileHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-outline-variant bg-surface/94 px-4 py-3 backdrop-blur md:hidden",
        className,
      )}
    >
      <BrandMark subtitle={subtitle} />
      <div className="flex shrink-0 items-center gap-1">
        <IconButton label="Notificaciones" size="sm" variant="ghost">
          <Bell />
        </IconButton>
        <IconButton label="Ayuda" size="sm" variant="ghost">
          <CircleHelp />
        </IconButton>
        <Avatar initials={userInitials} name={userName} size="sm" />
      </div>
    </header>
  );
}
