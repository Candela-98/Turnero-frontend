import type { ReactNode } from "react";
import { CalendarDays, Ellipsis, Scissors, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

export type AdminMobileBottomNavItem = {
  href: string;
  label: string;
  active?: boolean;
  icon: ReactNode;
};

export type AdminMobileBottomNavProps = {
  className?: string;
  items?: AdminMobileBottomNavItem[];
};

export const defaultAdminMobileBottomNavItems: AdminMobileBottomNavItem[] = [
  { active: true, href: "/agenda", icon: <CalendarDays />, label: "Agenda" },
  { href: "/clientes", icon: <UsersRound />, label: "Clientes" },
  { href: "/servicios", icon: <Scissors />, label: "Servicios" },
  { href: "/mas", icon: <Ellipsis />, label: "Más" },
];

export function AdminMobileBottomNav({
  className,
  items = defaultAdminMobileBottomNavItems,
}: AdminMobileBottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant bg-surface/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden",
        className,
      )}
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <a
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex min-h-touch flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low focus-visible:outline-focus-ring [&_svg]:size-5",
              item.active && "bg-surface-container-low text-primary",
            )}
            href={item.href}
            key={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
