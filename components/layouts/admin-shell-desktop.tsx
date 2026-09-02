import type { ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  CircleHelp,
  Gauge,
  Scissors,
  Search,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Avatar, Button, IconButton, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";

export type AdminNavItem = {
  href: string;
  label: string;
  active?: boolean;
  icon: ReactNode;
};

export type AdminShellDesktopProps = {
  children: ReactNode;
  className?: string;
  navItems?: AdminNavItem[];
  onNewAppointment?: () => void;
  userInitials?: string;
  userName?: string;
};

export const defaultAdminNavItems: AdminNavItem[] = [
  { href: "/dashboard", icon: <Gauge />, label: "Dashboard" },
  { active: true, href: "/agenda", icon: <CalendarDays />, label: "Agenda" },
  { href: "/clientes", icon: <UsersRound />, label: "Clientes" },
  { href: "/servicios", icon: <Scissors />, label: "Servicios" },
  { href: "/profesionales", icon: <UserRound />, label: "Profesionales" },
  { href: "/configuracion", icon: <Settings />, label: "Configuración" },
];

export function AdminShellDesktop({
  children,
  className,
  navItems = defaultAdminNavItems,
  onNewAppointment,
  userInitials = "MR",
  userName = "Mateo Ruiz",
}: AdminShellDesktopProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-80 flex-col border-r border-outline-variant bg-surface md:flex">
        <div className="px-7 py-8">
          <BrandMark />
        </div>

        <nav aria-label="Principal" className="flex-1 space-y-3 px-5 pt-4">
          {navItems.map((item) => (
            <a
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex min-h-touch items-center gap-4 rounded-lg px-4 text-lg font-medium text-on-surface-variant transition-colors hover:bg-surface-container-lowest hover:text-on-surface focus-visible:outline-focus-ring [&_svg]:size-5",
                item.active && "bg-surface-container-lowest text-primary shadow-soft",
              )}
              href={item.href}
              key={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="p-5">
          <Button className="h-12 w-full text-base shadow-floating" onClick={onNewAppointment}>
            <CalendarDays />
            Nuevo turno
          </Button>
        </div>
      </aside>

      <div className="min-h-screen md:ml-80">
        <header className="sticky top-0 z-20 hidden h-20 items-center gap-7 border-b border-outline-variant bg-surface/92 px-10 backdrop-blur md:flex">
          <div className="relative max-w-xl flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
            />
            <Input
              aria-label="Buscar"
              className="h-11 rounded-lg bg-surface-container-lowest pl-9 shadow-soft"
              placeholder="Buscar turnos, clientes o servicios..."
            />
          </div>
          <IconButton label="Notificaciones" variant="ghost">
            <Bell />
          </IconButton>
          <IconButton label="Ayuda" variant="ghost">
            <CircleHelp />
          </IconButton>
          <Avatar initials={userInitials} name={userName} size="sm" />
        </header>

        <main className={cn("mx-auto w-full max-w-[var(--content-max-width)] px-10 py-10", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
