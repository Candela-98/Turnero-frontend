import Link from "next/link";
import { Scissors, Settings, UserRound } from "lucide-react";

const moreItems = [
  { description: "Gestioná los servicios que ofrece el negocio.", href: "/servicios", icon: Scissors, label: "Servicios" },
  { description: "Administrá el equipo del negocio.", href: "/profesionales", icon: UserRound, label: "Profesionales" },
  { description: "Ajustá los datos y reglas del negocio.", href: "/configuracion", icon: Settings, label: "Configuración" },
];

export function MorePage() {
  return (
    <>
      <section className="hidden min-h-[60vh] items-center justify-center py-10 text-center md:flex">
        <div className="rounded-xl bg-surface-container-lowest p-10 shadow-panel">
          <p className="text-sm font-semibold text-primary">Administración</p>
          <h1 className="mt-3 text-3xl font-bold">Más opciones</h1>
          <p className="mt-3 text-on-surface-variant">Usá la navegación lateral para acceder a estas secciones.</p>
        </div>
      </section>
      <main className="min-h-[calc(100vh-4rem)] bg-surface px-5 py-6 text-on-surface md:hidden">
        <h1 className="text-2xl font-bold">Más opciones</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Accedé a la gestión del negocio.</p>
        <nav aria-label="Más opciones" className="mt-6 space-y-3">
          {moreItems.map(({ description, href, icon: Icon, label }) => (
            <Link
              className="flex min-h-touch items-center gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-soft transition-colors hover:bg-surface-container-low focus-visible:outline-focus-ring"
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" className="size-5 text-primary" />
              <span>
                <span className="block font-semibold">{label}</span>
                <span className="mt-1 block text-sm text-on-surface-variant">{description}</span>
              </span>
            </Link>
          ))}
        </nav>
      </main>
    </>
  );
}
