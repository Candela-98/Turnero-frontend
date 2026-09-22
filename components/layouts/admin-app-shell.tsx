"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Ellipsis,
  Gauge,
  Scissors,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  AdminMobileBottomNav,
  AdminMobileHeader,
  AdminShellDesktop,
  type AdminMobileBottomNavItem,
  type AdminNavItem,
} from "@/components/layouts";
import { useAuth } from "@/components/auth/auth-provider";

type AdminRoute = {
  href: string;
  label: string;
  mobile?: boolean;
  mobileLabel?: string;
  subtitle: string;
  icon: ReactNode;
};

const adminRoutes: AdminRoute[] = [
  { href: "/dashboard", icon: <Gauge />, label: "Dashboard", mobile: true, subtitle: "Resumen del negocio" },
  { href: "/agenda", icon: <CalendarDays />, label: "Agenda", mobile: true, subtitle: "Agenda de hoy" },
  { href: "/clientes", icon: <UsersRound />, label: "Clientes", mobile: true, subtitle: "Gestión de clientes" },
  { href: "/servicios", icon: <Scissors />, label: "Servicios", subtitle: "Gestión de servicios" },
  { href: "/profesionales", icon: <UserRound />, label: "Profesionales", subtitle: "Gestión de profesionales" },
  { href: "/configuracion", icon: <Settings />, label: "Configuración", subtitle: "Configuración del negocio" },
];

const moreRoute: AdminRoute = {
  href: "/mas",
  icon: <Ellipsis />,
  label: "Más",
  mobile: true,
  subtitle: "Más opciones",
};

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminAppShell({ children }: { children: ReactNode }) {
  const { business } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setIsDesktop(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  const desktopNavItems = useMemo<AdminNavItem[]>(
    () => adminRoutes.map((route) => ({ ...route, active: isRouteActive(pathname, route.href) })),
    [pathname],
  );
  const mobileNavItems = useMemo<AdminMobileBottomNavItem[]>(
    () => [...adminRoutes.filter((route) => route.mobile), moreRoute].map((route) => ({
      ...route,
      active: isRouteActive(pathname, route.href),
    })),
    [pathname],
  );
  const currentRoute = [...adminRoutes, moreRoute].find((route) => isRouteActive(pathname, route.href));

  function openNewAppointment() {
    router.push("/agenda?new=1");
  }

  if (isDesktop === null) {
    return <div className="min-h-screen bg-surface" />;
  }

  if (isDesktop) {
    return (
      <AdminShellDesktop businessName={business?.name} navItems={desktopNavItems} onNewAppointment={openNewAppointment}>
        {children}
      </AdminShellDesktop>
    );
  }

  return (
    <>
      <AdminMobileHeader businessName={business?.name} subtitle={currentRoute?.subtitle ?? "Panel administrativo"} />
      <div
        className="min-h-[calc(100vh-4rem)] md:contents"
        style={{ paddingBottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
      <AdminMobileBottomNav items={mobileNavItems} />
    </>
  );
}
